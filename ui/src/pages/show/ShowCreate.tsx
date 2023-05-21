import React, { useEffect, useState } from 'react'
import { queryFetch } from '../../utils'
import { Data, GroupMember } from '../../types'
import configStore from '../../stores/config'
import authStore from '../../stores/auth'

interface ShowProps {
    input: string
}

export default function ShowCreate({ input }: ShowProps) {
    const [clients, setClients] = useState<GroupMember[]>([])
    const [data, setData] = useState<Data>({})

    const config = configStore(state => ({ ...state }))
    const token = authStore(state => state.token)

    useEffect(() => {
        const groupName = decodeURI(input).trim()
        queryFetch(
            `${config.address}/api/group/get`,
            {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` }
            },
            { name: groupName }
        )
            .then(res => {
                if (res.status === 200) return res.json()
                throw new Error('error while fetching clients infos')
            })
            .then(members => members as GroupMember[])
            .then(members =>
                members.sort((a, b) => a.clientOrder - b.clientOrder)
            )
            .then(members => setClients(members))
    }, [input])

    return <div>ShowCreate</div>
}
