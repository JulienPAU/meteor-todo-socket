import React, { useState } from "react";
import { useTracker } from "meteor/react-meteor-data";
import { Meteor } from "meteor/meteor";
import { GroupMember } from "/imports/types/group";
import { GroupsCollection } from "/imports/api/GroupsCollection";

interface GroupMembersProps {
    groupId: string;
    currentUserId: string;
}

export const GroupMembers = ({ groupId, currentUserId }: GroupMembersProps) => {
    const [newMemberUsername, setNewMemberUsername] = useState("");
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [searchResults, setSearchResults] = useState<Array<{ _id: string; username: string }>>([]);

    const { group, isAdmin, isLoading } = useTracker(() => {
        const subscription = Meteor.subscribe("groupDetails", groupId);
        const group = GroupsCollection.findOne(groupId);

        const isAdmin = currentUserId && group ? group.members.some((member) => member.userId === currentUserId && member.role === "admin") : false;

        return {
            isLoading: !subscription.ready(),
            group,
            isAdmin,
        };
    }, [groupId, currentUserId]);

    const handleSearchUser = (e: React.ChangeEvent<HTMLInputElement>) => {
        const username = e.target.value;
        setNewMemberUsername(username);

        if (username.length >= 2) {
            Meteor.callAsync("users.search", { username })
                .then((results: any) => {
                    if (results && Array.isArray(results)) {
                        const filteredResults = results.filter((user: any) => {
                            return !group?.members.some((member: GroupMember) => member.userId === user._id);
                        });
                        setSearchResults(filteredResults);
                    }
                })
                .catch((error) => {
                    console.error("Erreur lors de la recherche utilisateur:", error);
                    setSearchResults([]);
                });
        } else {
            setSearchResults([]);
        }
    };

    const handleAddMember = (userId: string, username: string) => {
        Meteor.callAsync("groups.addMember", {
            groupId,
            userId,
            username,
        })
            .then(() => {
                setNewMemberUsername("");
                setSearchResults([]);
                setIsAddingMember(false);
            })
            .catch((error) => {
                alert(`Erreur lors de l'ajout du membre: ${error.message}`);
            });
    };

    const handleRemoveMember = (userId: string) => {
        if (window.confirm("Êtes-vous sûr de vouloir retirer ce membre du groupe?")) {
            Meteor.callAsync("groups.removeMember", {
                groupId,
                userId,
            }).catch((error) => {
                alert(`Erreur lors du retrait du membre: ${error.message}`);
            });
        }
    };

    const handleChangeRole = (userId: string, currentRole: string) => {
        const newRole = currentRole === "admin" ? "member" : "admin";
        if (window.confirm(`Êtes-vous sûr de vouloir changer le rôle de ce membre à "${newRole}"?`)) {
            Meteor.callAsync("groups.changeMemberRole", {
                groupId,
                userId,
                role: newRole,
            }).catch((error) => {
                alert(`Erreur lors du changement de rôle: ${error.message}`);
            });
        }
    };

    if (isLoading) {
        return <div className="members-loading">Chargement des membres...</div>;
    }

    if (!group) {
        return <div className="members-error">Groupe non trouvé</div>;
    }

    return (
        <div className="group-members">
            <div className="members-header">
                <h3>Membres ({group.members.length})</h3>
                {isAdmin && (
                    <button type="button" className="add-member-btn" onClick={() => setIsAddingMember(!isAddingMember)}>
                        {isAddingMember ? "Annuler" : "Ajouter un membre"}
                    </button>
                )}
            </div>

            {isAddingMember && isAdmin && (
                <div className="add-member-form">
                    <input type="text" placeholder="Nom d'utilisateur..." value={newMemberUsername} onChange={handleSearchUser} className="add-member-input" />

                    {searchResults.length > 0 && (
                        <div className="user-search-results">
                            {searchResults.map((user) => (
                                <div key={user._id} className="user-search-item" onClick={() => handleAddMember(user._id, user.username)}>
                                    {user.username}
                                </div>
                            ))}
                        </div>
                    )}

                    {newMemberUsername.length >= 2 && searchResults.length === 0 && <div className="no-results">Aucun utilisateur trouvé</div>}
                </div>
            )}

            <div className="members-list">
                {group.members.map((member: GroupMember) => {
                    const isCurrentUser = member.userId === currentUserId;

                    return (
                        <div key={member.userId} className="member-item">
                            <div className="member-color-dot" style={{ backgroundColor: member.color || "#ccc" }}></div>
                            <div className="member-info">
                                <span className="member-name">
                                    {member.username}
                                    {isCurrentUser && <span className="current-user-tag"> (vous)</span>}
                                </span>
                                <span className="member-role">{member.role === "admin" ? "Administrateur" : "Membre"}</span>
                            </div>

                            {isAdmin && !isCurrentUser && (
                                <div className="member-actions">
                                    <button type="button" className="change-role-btn" onClick={() => handleChangeRole(member.userId, member.role)} title={`Changer en ${member.role === "admin" ? "membre" : "administrateur"}`}>
                                        {member.role === "admin" ? "⬇️" : "⬆️"}
                                    </button>
                                    <button type="button" className="remove-member-btn" onClick={() => handleRemoveMember(member.userId)} title="Retirer du groupe">
                                        ×
                                    </button>
                                </div>
                            )}

                            {!isAdmin && isCurrentUser && (
                                <div className="member-actions">
                                    <button type="button" className="leave-group-btn" onClick={() => handleRemoveMember(member.userId)} title="Quitter le groupe">
                                        Quitter
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
