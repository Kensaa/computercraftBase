import React, { useState } from 'react'
import { Form, Button, Container, Alert } from 'react-bootstrap'
import AppNavbar from '../components/AppNavbar'
import sha256 from 'crypto-js/sha256'

import authStore from '../stores/auth'
import configStore from '../stores/config'
import { useLocation } from 'wouter'

export default function Login() {
    const [, setLocation] = useLocation()
    const [validated, setValidated] = useState(false)
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')

    const [error, setError] = useState('')

    const login = authStore(state => state.login)
    const config = configStore(state => ({ ...state }))

    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        event.stopPropagation()
        setValidated(true)
        if (!event.currentTarget.checkValidity()) return
        const hashedPassword = sha256(password).toString()

        fetch(config.address + '/api/account/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password: hashedPassword })
        }).then(res => {
            if (res.status === 200) {
                return res.json().then(json => {
                    login(json)
                    setLocation('/')
                })
            } else {
                switch (res.status) {
                    case 404:
                        showError('User not found')
                        break
                    case 401:
                        showError('Wrong password')
                        break
                    default:
                        showError('unknown error')
                        break
                }
            }
        })
    }
    const showError = (err: string) => {
        setError(err)
        setTimeout(() => {
            setError('')
        }, 3000)
    }

    return (
        <div className='w-100 h-100 d-flex flex-column'>
            <AppNavbar />
            {error && (
                <Alert
                    dismissible
                    variant='danger'
                    onClose={() => setError('')}
                >
                    {error}
                </Alert>
            )}
            <Form
                noValidate
                validated={validated}
                onSubmit={onSubmit}
                className='h-75 d-flex flex-column align-items-center mt-5'
            >
                <Form.Group controlId='username' className='mb-3'>
                    <Form.Label>Nom d'utilisateur</Form.Label>
                    <Form.Control
                        type='text'
                        placeholder="Nom d'utilisateur"
                        required
                        value={username}
                        onChange={({ currentTarget }) =>
                            setUsername(currentTarget.value)
                        }
                    />
                    <Form.Control.Feedback type='invalid'>
                        Nom d'utilisateur invalide
                    </Form.Control.Feedback>
                </Form.Group>
                <Form.Group controlId='password' className='mb-3'>
                    <Form.Label>Mot de passe</Form.Label>
                    <Form.Control
                        type='password'
                        placeholder='Mot de passe'
                        required
                        value={password}
                        onChange={({ currentTarget }) =>
                            setPassword(currentTarget.value)
                        }
                    />
                    <Form.Control.Feedback type='invalid'>
                        Mot de passe invalide
                    </Form.Control.Feedback>
                </Form.Group>
                <Button variant='primary' type='submit'>
                    Connexion
                </Button>
            </Form>
        </div>
    )
}
