import React from "react";
import { useTracker, useSubscribe } from "meteor/react-meteor-data";
import { Meteor } from "meteor/meteor";
import { Group } from "/imports/types/group";
import { GroupsCollection } from "/imports/api/GroupsCollection";
import { formatDate } from "/imports/utils/validators";
import { MessagesCollection } from "/imports/api/MessagesCollection";
import { TasksCollection } from "/imports/api/TasksCollection";

interface GroupsListProps {
    onSelectGroup: (groupId: string, groupName: string) => void;
    selectedGroupId: string | null;
    onCreateGroup: () => void;
    currentUserId: string;
}

export const GroupsList = ({ onSelectGroup, selectedGroupId, onCreateGroup, currentUserId }: GroupsListProps) => {
    useSubscribe("groups");
    useSubscribe("messages");
    useSubscribe("tasks.allGroupTasks");
    useSubscribe("groupMessages.all");

    const { isLoading, groups, groupNotifications } = useTracker(() => {
        const groupsReady = Meteor.subscribe("groups").ready();
        const messagesReady = Meteor.subscribe("messages").ready();
        const tasksReady = Meteor.subscribe("tasks.allGroupTasks").ready();
        const groupMessagesReady = Meteor.subscribe("groupMessages.all").ready();

        if (!groupsReady || !messagesReady || !tasksReady || !groupMessagesReady) {
            return {
                isLoading: true,
                groups: [],
                groupNotifications: {},
            };
        }

        const groups = GroupsCollection.find({ "members.userId": currentUserId }, { sort: { createdAt: -1 } }).fetch();

        const notifications: Record<string, boolean> = {};

        groups.forEach((group) => {
            const groupId = group._id as string;

            const unreadMessages =
                MessagesCollection.find({
                    groupId: groupId,
                    senderId: { $ne: currentUserId },
                    $or: [{ readBy: { $exists: false } }, { readBy: { $ne: currentUserId } }],
                }).count() > 0;

            const pendingTasks =
                TasksCollection.find({
                    groupId: groupId,
                    isChecked: { $ne: true },
                }).count() > 0;

            notifications[groupId] = unreadMessages || pendingTasks;
        });

        return {
            isLoading: false,
            groups,
            groupNotifications: notifications,
        };
    }, [currentUserId]);

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
        <div className="groups-sidebars">
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
                        const userId = currentUserId;
                        const isAdmin = group.members.some((member) => member.userId === userId && member.role === "admin");

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
                                    {isAdmin && (
                                        <button className="delete-group-btn" onClick={(e) => handleDeleteGroup(group._id!, e)} title="Supprimer le groupe">
                                            &times;
                                        </button>
                                    )}
                                </div>
                                <div className="group-meta">
                                    <span className="group-members-count">
                                        {group.members.length} membre
                                        {group.members.length > 1 ? "s" : ""}
                                    </span>
                                    <span className="group-date">{formatDate(group.createdAt)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
