import React, { useEffect, useState } from 'react'
import { Button, Modal, Tab, Tabs } from 'react-bootstrap'
import configStore from '../../stores/config'
import authStore from '../../stores/auth'
import { Client, Group, GroupMember } from '../../types'
import { queryFetch } from '../../utils'
import ClientSearch from '../../components/ClientSearch'
import {
    DragDropContext,
    Draggable,
    Droppable,
    DropResult
} from 'react-beautiful-dnd'

interface EditGroupModalProps {
    group?: Group
    hide: () => void
}

export default function EditGroupModal({ group, hide }: EditGroupModalProps) {
    if (!group) return <div>ERROR</div>

    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([])

    const config = configStore(state => ({ ...state }))
    const token = authStore(state => state.token)

    useEffect(() => {
        queryFetch(
            `${config.address}/api/group/get`,
            { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
            { name: group.name }
        )
            .then(res => {
                if (res.status === 200) return res.json()
                throw new Error('error while fetching data')
            })
            .then(data => setGroupMembers(data))
    }, [group])

    const deleteGroup = () => {
        fetch(`${config.address}/api/group/remove`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: group.name })
        })
        hide()
    }

    return (
        <Modal
            show={group !== undefined}
            dialogClassName='large-modal'
            onHide={hide}
        >
            <Modal.Header closeButton>
                <Modal.Title>Editing group "{group.name}"</Modal.Title>
                <Button
                    onClick={deleteGroup}
                    variant='outline-danger'
                    style={{ marginLeft: 'auto' }}
                >
                    Delete group
                </Button>
            </Modal.Header>
            <Modal.Body>
                <Tabs fill>
                    <Tab eventKey='edit' title='add/remove clients'>
                        <EditTab
                            groupMembers={groupMembers}
                            group={group}
                            hide={hide}
                        />
                    </Tab>
                    <Tab eventKey='order' title='edit order'>
                        <div className='d-flex justify-content-center'>
                            <OrderTab
                                groupMembers={groupMembers}
                                group={group}
                                hide={hide}
                            />
                        </div>
                    </Tab>
                </Tabs>
            </Modal.Body>
        </Modal>
    )
}

interface TabsProps {
    groupMembers: GroupMember[]
    group: Group
    hide: () => void
}

function EditTab({ groupMembers, group, hide }: TabsProps) {
    const config = configStore(state => ({ ...state }))
    const token = authStore(state => state.token)

    const addMember = (groupName: string, clientName: string) => {
        fetch(`${config.address}/api/group/addClient`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                groupName,
                clientName
            })
        })
    }
    const removeMember = (groupName: string, clientName: string) => {
        fetch(`${config.address}/api/group/removeClient`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                groupName,
                clientName
            })
        })
    }

    const handleMemberChange = (newMembers: Client[]) => {
        const oldMembers = groupMembers.map(e => e.name)
        for (const newMember of newMembers) {
            if (oldMembers.includes(newMember.name)) {
                // <=> member is still in group
                //we remove it from array so it's not removed from group after
                oldMembers.splice(oldMembers.indexOf(newMember.name), 1)
            } else {
                //add member to group
                addMember(group.name, newMember.name)
            }
        }
        //looping through the remaining old members to delete them from group
        for (const oldMember of oldMembers) {
            removeMember(group.name, oldMember)
        }
        hide()
    }
    return (
        <div className='d-flex justify-content-center'>
            <ClientSearch
                onValidate={handleMemberChange}
                preSelected={groupMembers}
                ShowDisconnected
                className='mt-2'
            />
        </div>
    )
}

function OrderTab({ groupMembers: startGroupMember, group, hide }: TabsProps) {
    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([])

    const config = configStore(state => ({ ...state }))
    const token = authStore(state => state.token)

    useEffect(() => {
        if (startGroupMember && startGroupMember.length > 0) {
            const copy = [...startGroupMember]
            copy.sort((a, b) => a.clientOrder - b.clientOrder)
            setGroupMembers(copy)
        }
    }, [startGroupMember])

    const onDragEnd = (result: DropResult) => {
        const { source, destination } = result
        if (!destination) return

        const e = groupMembers.splice(source.index, 1)[0]
        groupMembers.splice(destination.index, 0, e)
    }

    const save = () => {
        const orderObject: Record<string, number> = {}
        let i = 1
        for (const member of groupMembers) {
            orderObject[member.name] = i
            i++
        }
        fetch(`${config.address}/api/group/setOrders`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ groupName: group.name, orders: orderObject })
        })
        hide()
    }
    return (
        <div className='w-100 h-100 d-flex flex-column align-items-center'>
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId='left'>
                    {provided => (
                        <div
                            ref={provided.innerRef}
                            className='w-100 d-flex flex-column align-items-center mt-2'
                            {...provided.droppableProps}
                        >
                            {groupMembers.map((groupMember, index) => (
                                <Draggable
                                    key={groupMember.name}
                                    index={index}
                                    draggableId={groupMember.name}
                                >
                                    {provided => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                        >
                                            <h3>{groupMember.name}</h3>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
            <Button onClick={save}>Save</Button>
        </div>
    )
}
