import React, { useState } from 'react'
import AppNavbar from '../../components/AppNavbar'
import GroupSearch from '../../components/GroupSearch'
import { Group } from '../../types'
import CreateGroupModal from './CreateGroupModal'
import EditGroupModal from './EditGroupModal'

export default function Groups() {
    const [createModal, setCreateModal] = useState(false)
    const [editedGroup, setEditedGroup] = useState<Group>()

    return (
        <div className='w-100 h-100 d-flex flex-column'>
            <AppNavbar />
            <div className='m-0 mt-2 p-0 h-100 w-100 d-flex flex-column align-items-center'>
                <h2>Select a group to edit</h2>
                <GroupSearch
                    onValidate={group => setEditedGroup(group)}
                    addButton
                    onAddButtonClicked={() => setCreateModal(true)}
                />
                <CreateGroupModal
                    show={createModal}
                    hide={() => setCreateModal(false)}
                />

                <EditGroupModal
                    group={editedGroup}
                    hide={() => setEditedGroup(undefined)}
                />
            </div>
        </div>
    )
}
