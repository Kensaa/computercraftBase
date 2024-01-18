import React, { useState } from 'react'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import configStore from '../../stores/config'
import authStore from '../../stores/auth'
import dataStore from '../../stores/data'
import { groupTypes } from '../../types'

interface CreateGroupModalProps {
    show: boolean
    hide: () => void
}

export default function CreateGroupModal({ show, hide }: CreateGroupModalProps) {
    const [name, setName] = useState('')
    const [type, setType] = useState(groupTypes[0])
    const [error, setError] = useState('')

    const config = configStore(state => ({ ...state }))
    const token = authStore(state => state.token)
    const refetchGroup = dataStore(state => state.refetchGroups)

    const onValidate = () => {
        fetch(`${config.address}/api/group/create`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                type
            })
        }).then(res => {
            if (res.ok) {
                hide()
                config.setAddress(config.address)
                refetchGroup()
                setName('')
                setType(groupTypes[0])
            } else {
                if (res.status === 409) {
                    setError(`The group "${name}" already exists`)
                } else {
                    setError('Unknown Error')
                }
            }
        })
    }

    return (
        <Modal show={show} onHide={hide}>
            <Modal.Header closeButton>
                <Modal.Title>Create a new Group</Modal.Title>
            </Modal.Header>
            <Modal.Body className='d-flex flex-column align-items-center'>
                {error && (
                    <Alert
                        className='position-absolute'
                        style={{ textAlign: 'center', zIndex: 1000 }}
                        dismissible
                        variant='danger'
                        onClose={() => setError('')}
                    >
                        {error}
                    </Alert>
                )}
                <Form.Control
                    placeholder='name of the group'
                    value={name}
                    onChange={e => setName(e.target.value)}
                ></Form.Control>
                <Form.Select value={type} onChange={e => setType(e.target.value)} className='mt-2'>
                    {groupTypes.map((type, index) => (
                        <option key={index} value={type}>
                            {type}
                        </option>
                    ))}
                </Form.Select>
                <Button
                    variant='outline-primary'
                    className='mt-2'
                    onClick={onValidate}
                    disabled={name.length === 0 || error !== ''}
                >
                    Create
                </Button>
            </Modal.Body>
        </Modal>
    )
}
