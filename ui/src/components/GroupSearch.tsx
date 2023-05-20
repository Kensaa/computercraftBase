import React, { useEffect, useState } from 'react'
import { Button, Form, Table } from 'react-bootstrap'

import authStore from '../stores/auth'
import configStore from '../stores/config'
import { Group } from '../types'

interface GroupSearchProps {
    onValidate: (selectedGroup: Group) => void
}

export default function GroupSearch({ onValidate }: GroupSearchProps) {
    const [searchValue, setSearchValue] = useState('')

    const [groups, setGroups] = useState<Group[]>([])
    const [selectedGroup, setSelectedGroup] = useState<number>(-1)
    const [shownGroups, setShownGroups] = useState<Group[]>([])

    const config = configStore(state => ({ ...state }))
    const token = authStore(state => state.token)

    useEffect(() => {
        fetch(`${config.address}/api/group/all`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(res => {
                setGroups(res)
            })
    }, [config.address, token])

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

    const groupClicked = (index: number) => {
        if (selectedGroup === index) {
            setSelectedGroup(-1)
        } else {
            setSelectedGroup(index)
        }
    }

    const onBtnPressed = () => {
        if (selectedGroup === -1) return
        onValidate(shownGroups[selectedGroup])
        setSelectedGroup(-1)
    }

    return (
        <div
            style={{ width: '45%' }}
            className='h-100 d-flex flex-column align-items-center'
        >
            <Form.Control
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                className=''
                placeholder='Search for a group'
            />
            <Table className='mt-4' bordered hover>
                <thead>
                    <tr>
                        <th>Name</th>
                    </tr>
                </thead>
                <tbody>
                    {shownGroups.map((group, index) => {
                        const selected = selectedGroup === index
                        const disabled = false
                        return (
                            <GroupRow
                                group={group}
                                key={index}
                                onClick={() => groupClicked(index)}
                                selected={selected}
                                disabled={disabled}
                            />
                        )
                    })}
                </tbody>
            </Table>
            <Button
                disabled={selectedGroup === -1}
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
        </tr>
    )
}
