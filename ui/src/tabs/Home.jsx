import React from 'react'
import {Container} from 'react-bootstrap'

import AppNavbar from '../components/AppNavbar'

export default function Home({config}) {
  return (
    <Container fluid className='m-0 p-0 h-100'>
      <AppNavbar/>
      <Container className='h-75 d-flex flex-column align-items-center border mt-5'>
        <h1>TEST</h1>
        <h1>TEST</h1>
        <h1>TEST</h1>
        <h1>TEST</h1>
        <h1>TEST</h1>
      </Container>
    </Container>
  )
}
