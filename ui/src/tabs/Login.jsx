import React,{useState,useEffect} from 'react'
import { Form, Button,Container,Alert } from "react-bootstrap";
import sha256 from 'crypto-js/sha256';
import { useNavigate } from 'react-router-dom';

import AppNavbar from '../components/AppNavbar'

export default function Login({config, auth}) {
    const navigate = useNavigate()
    const [validated, setValidated] = useState(false)
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')

    const [error,setError] = useState('')

    const [connected,info,login,logout] = auth;

    useEffect(()=>{
        if(connected) {
            navigate('/')
        }
    },[connected,navigate])

    const onSubmit = (event)=>{
        event.preventDefault()
        event.stopPropagation()
        setValidated(true)
        if(event.currentTarget.checkValidity()){
            const hashedPassword = sha256(password).toString()
            fetch(config.address+'api/user/login',{
                method:'POST',
                headers: { 'Content-Type': 'application/json' },
                body:JSON.stringify({username,password:hashedPassword})
            })
                .then(res=>{
                    if(res.status === 404){
                        return setError('Utilisateur inconnu')
                    }
                    if(res.status === 401){
                        return setError('Mot de passe incorrect')
                    }
                    if(res.status !== 200){
                        return setError('Erreur inconnue')
                    }
                    res.json().then(data=>{
                        login(data)
                    })
                })
                .catch(err=>{
                    setError(err.message)
                })
        }
    }

  return (
    <Container fluid className='m-0 p-0 h-100'>
        <AppNavbar auth={auth}/>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form noValidate validated={validated} onSubmit={onSubmit} className='h-75 d-flex flex-column align-items-center mt-5'>
            <Form.Group controlId='username' className="mb-3">
                <Form.Label>Nom d'utilisateur</Form.Label>
                <Form.Control
                            type="text"
                            placeholder="Nom d'utilisateur"
                            required
                            value={username}
                            onChange={({ currentTarget }) => 
                                setUsername(currentTarget.value)
                            }
                        />
                <Form.Control.Feedback type='invalid'>Nom d'utilisateur invalide</Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId='password' className="mb-3">
                <Form.Label>Mot de passe</Form.Label>
                <Form.Control
                            type="password"
                            placeholder="Mot de passe"
                            required
                            value={password}
                            onChange={({ currentTarget }) => 
                            setPassword(currentTarget.value)
                            }
                        />
                <Form.Control.Feedback type='invalid'>Mot de passe invalide</Form.Control.Feedback>
            </Form.Group>
            <Button variant="primary" type="submit">Connexion</Button>
        </Form>
    </Container>
  )
}
