import React, { useState, useEffect } from "react";
import { useTracker } from "meteor/react-meteor-data";
import { Meteor } from "meteor/meteor";
import { Group } from "/imports/types/group";
import { GroupsCollection } from "/imports/api/GroupsCollection";
import { formatDate } from "/imports/utils/validators";

interface GroupsListProps {
    onSelectGroup: (groupId: string, groupName: string) => void;
    selectedGroupId: string | null;
    onCreateGroup: () => void;
    currentUserId: string;
}

export const GroupsList = ({ onSelectGroup, selectedGroupId, onCreateGroup }: GroupsListProps) => {
    const { isLoading, groups } = useTracker(() => {
        const groupsReady = Meteor.subscribe("groups").ready();

        if (!groupsReady) {
            return {
                isLoading: true,
                groups: [],
            };
        }

        const groups = GroupsCollection.find({ "members.userId": Meteor.userId() }, { sort: { createdAt: -1 } }).fetch();

        return {
            isLoading: false,
            groups,
        };
    }, []);

    const [groupNotifications, setGroupNotifications] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (isLoading || !groups.length) return;

        const checkGroupsActivity = async () => {
            try {
                const result = await Meteor.callAsync("messages.checkGroupActivity");
                if (result && result.groupsWithActivity) {
                    const notifications: Record<string, boolean> = {};

                    for (const groupId of result.groupsWithActivity) {
                        notifications[groupId] = true;
                    }

                    setGroupNotifications(notifications);
                }
            } catch (error) {
                console.error("Erreur lors de la vérification des activités:", error);
            }
        };

        checkGroupsActivity();

        const intervalId = setInterval(checkGroupsActivity, 5000);

        return () => clearInterval(intervalId);
    }, [isLoading, groups]);

    const handleDeleteGroup = (groupId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce groupe ? Cette action est irréversible.")) {
            Meteor.callAsync("groups.delete", groupId).catch((error) => {
                alert(`Erreur lors de la suppression du groupe: ${error.message}`);
            });
        }
    };

    if (isLoading) {
        return (
            <div className="groups-sidebar-loading">
                <p>Chargement des groupes...</p>
            </div>
        );
    }

    return (
        <div className="groups-sidebar">
            <div className="groups-header">
                <h3>Mes groupes</h3>
                <button className="create-group-btn" onClick={onCreateGroup} title="Créer un nouveau groupe">
                    +
                </button>
            </div>

            {groups.length === 0 ? (
                <div className="empty-groups-message">
                    <p>Vous n'avez pas encore de groupe</p>
                    <p>Créez-en un pour commencer à collaborer</p>
                </div>
            ) : (
                <div className="groups-list">
                    {groups.map((group: Group) => {
                        const userId = Meteor.userId();
                        const isAdmin = userId ? group.members.some((member) => member.userId === userId && member.role === "admin") : false;

                        return (
                            <div key={group._id} className={`group-item ${selectedGroupId === group._id ? "active" : ""}`} onClick={() => onSelectGroup(group._id!, group.name)}>
                                <div className="group-name-container">
                                    <div className="group-name">
                                        {group.name}
                                        {groupNotifications[group._id as string] && (
                                            <span
                                                className="group-notification-badge"
                                                style={{
                                                    display: "inline-block",
                                                    width: "10px",
                                                    height: "10px",
                                                    borderRadius: "50%",
                                                    backgroundColor: "red",
                                                    marginLeft: "8px",
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="group-meta">
                                    <span className="group-members-count">
                                        {group.members.length} membre
                                        {group.members.length > 1 ? "s" : ""}
                                    </span>
                                    <span className="group-date">{formatDate(group.createdAt)}</span>
                                    {isAdmin && (
                                        <button className="delete-group-btn" onClick={(e) => handleDeleteGroup(group._id!, e)} title="Supprimer le groupe">
                                            ×
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
