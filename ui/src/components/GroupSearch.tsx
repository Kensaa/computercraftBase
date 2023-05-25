import React, { useEffect, useState } from 'react'
import { Button, Form, Table } from 'react-bootstrap'

import authStore from '../stores/auth'
import configStore from '../stores/config'
import dataStore from '../stores/data'
import { Group } from '../types'
import { Plus } from 'lucide-react'

interface GroupSearchProps {
    onValidate: (selectedGroup: Group) => void
    addButton?: boolean
    onAddButtonClicked?: () => void
}

export default function GroupSearch({
    onValidate,
    addButton = false,
    onAddButtonClicked
}: GroupSearchProps) {
    const [searchValue, setSearchValue] = useState('')

    //const [groups, setGroups] = useState<Group[]>([])
    const [selectedGroup, setSelectedGroup] = useState<Group>()
    const [shownGroups, setShownGroups] = useState<Group[]>([])

    const config = configStore(state => ({ ...state }))
    const token = authStore(state => state.token)
    const { groups, refetchGroups } = dataStore(state => ({ ...state }))
    /*useEffect(() => {
        fetch(`${config.address}/api/group/all`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(res => {
                setGroups(res)
            })
    }, [config.address, token])*/

    // force refetch on groups to update the current cached list
    useEffect(refetchGroups, [])

    useEffect(() => {
        let before = groups
        if (searchValue.length === 0) {
            setShownGroups(before)
        } else {
            const after = []
            const searchKeys = ['name']
            for (const client of before) {
                const value = searchValue.toLowerCase()
                for (const key of searchKeys) {
                    // @ts-ignore
                    if (client[key].toLowerCase().includes(value)) {
                        after.push(client)

                        break
                    }
                }
            }
            setShownGroups(after)
        }
    }, [groups, searchValue])

    const groupClicked = (group: Group) => {
        if (selectedGroup === group) {
            setSelectedGroup(undefined)
        } else {
            setSelectedGroup(group)
        }
    }

    const onBtnPressed = () => {
        if (!selectedGroup) return
        onValidate(selectedGroup)
        setSelectedGroup(undefined)
    }

    return (
        <div
            style={{ width: '45%' }}
            className='h-100 d-flex flex-column align-items-center'
        >
            <div className='d-flex w-100'>
                <Form.Control
                    value={searchValue}
                    onChange={e => setSearchValue(e.target.value)}
                    className=''
                    placeholder='Search for a group'
                />
                {addButton && (
                    <Button
                        variant='outline-primary'
                        className='ms-1'
                        onClick={onAddButtonClicked}
                    >
                        <Plus size={24} className='w-100 me-1' />
                        Create Group
                    </Button>
                )}
            </div>
            <Table className='mt-4' bordered hover>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Type</th>
                    </tr>
                </thead>
                <tbody>
                    {shownGroups.map((group, index) => {
                        const selected = selectedGroup === group
                        const disabled = false
                        return (
                            <GroupRow
                                group={group}
                                key={index}
                                onClick={() => groupClicked(group)}
                                selected={selected}
                                disabled={disabled}
                            />
                        )
                    })}
                </tbody>
            </Table>
            <Button
                disabled={!selectedGroup}
                variant='outline-primary'
                onClick={onBtnPressed}
            >
                Select
            </Button>
        </div>
    )
}

interface GroupRowProps {
    group: Group
    onClick: () => void
    selected?: boolean
    disabled?: boolean
}

function GroupRow({
    group,
    onClick,
    selected = false,
    disabled = false
}: GroupRowProps) {
    return (
        <tr
            className={[
                'user-select-none',
                'tableRow',
                selected ? 'selected' : '',
                disabled ? 'disabled' : ''
            ]
                .filter(e => e !== '')
                .join(' ')}
            onClick={onClick}
        >
            <td>{group.name}</td>
            <td>{group.type}</td>
        </tr>
    )
}
