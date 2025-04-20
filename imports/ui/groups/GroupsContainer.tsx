import React, { useState, useEffect } from "react";
import { useTracker } from "meteor/react-meteor-data";
import { Meteor } from "meteor/meteor";
import { User } from "../../types/user";
import { GroupsList } from "./GroupsList";
import { GroupMembers } from "./GroupMembers";
import { GroupTasks } from "./GroupTasks";
import { GroupChat } from "./GroupChat";
import { CreateGroupModal } from "./CreateGroupModal";
import { MessagesCollection } from "../../api/MessagesCollection";
import { TasksCollection } from "../../api/TasksCollection";

interface GroupsContainerProps {
    user: User;
}

type GroupTab = "tasks" | "members" | "chat";

interface TabNotifications {
    tasks: number;
    chat: number;
}

export const GroupsContainer: React.FC<GroupsContainerProps> = ({ user }) => {
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [selectedGroupName, setSelectedGroupName] = useState<string>("");
    const [activeTab, setActiveTab] = useState<GroupTab>("tasks");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showHiddenTasks, setShowHiddenTasks] = useState<boolean>(true);

    useTracker(() => {
        Meteor.subscribe("messages");
        Meteor.subscribe("tasks");
        Meteor.subscribe("groups");
        return {};
    }, []);

    const { notifications, hasActivity } = useTracker(() => {
        if (!selectedGroupId) {
            return {
                notifications: { tasks: 0, chat: 0 },
                hasActivity: false,
            };
        }

        Meteor.subscribe("groupMessages", selectedGroupId);
        Meteor.subscribe("tasks.inGroup", selectedGroupId);

        const lastReadTimestampGroup = user?.lastReadTimestamps?.groups?.[selectedGroupId];
        const lastReadChat = lastReadTimestampGroup ? new Date(lastReadTimestampGroup) : new Date(0);

        const newMessages = MessagesCollection.find({
            groupId: selectedGroupId,
            $or: [{ readBy: { $exists: false } }, { readBy: { $ne: user._id } }],
            senderId: { $ne: user._id },
        }).count();

        const pendingTasks = TasksCollection.find({
            groupId: selectedGroupId,
            isChecked: { $ne: true },
        }).count();

        const hasActivity = newMessages > 0 || pendingTasks > 0;

        return {
            notifications: {
                tasks: showHiddenTasks ? pendingTasks : 0,
                chat: newMessages,
            },
            hasActivity,
        };
    }, [selectedGroupId, user, showHiddenTasks]);

    useEffect(() => {
        if (selectedGroupId && activeTab) {
            if (activeTab === "chat") {
                Meteor.callAsync("messages.markGroupMessagesAsRead", selectedGroupId).catch((error) => {
                    console.error("Erreur lors du marquage des messages comme lus:", error);
                });
            }
        }
    }, [selectedGroupId, activeTab]);

    useEffect(() => {
        const refreshSubscriptions = () => {
            Meteor.callAsync("messages.checkGroupActivity")
                .then((result) => {
                    if (result && result.hasActivity && selectedGroupId) {
                        Meteor.subscribe("groupMessages", selectedGroupId);
                        Meteor.subscribe("tasks.inGroup", selectedGroupId);
                    }
                })
                .catch((error) => {
                    console.error("Erreur lors de la vérification des activités:", error);
                });
        };

        refreshSubscriptions();

        const intervalId = setInterval(refreshSubscriptions, 10000);

        return () => clearInterval(intervalId);
    }, [selectedGroupId]);

    const handleTasksVisibility = (showAll: boolean) => {
        setShowHiddenTasks(showAll);
    };

    const handleGroupSelect = (groupId: string, groupName: string) => {
        setSelectedGroupId(groupId || null);
        setSelectedGroupName(groupName);
    };

    const handleCreateGroup = () => {
        setShowCreateModal(true);
    };

    return (
        <div className="groups-container">
            <div className="groups-sidebar">
                <GroupsList currentUserId={user._id} selectedGroupId={selectedGroupId} onSelectGroup={handleGroupSelect} onCreateGroup={handleCreateGroup} />
            </div>

            <div className="groups-content">
                {selectedGroupId ? (
                    <>
                        <div className="group-header">
                            <h2>{selectedGroupName}</h2>

                            <div className="group-tabs">
                                <button type="button" className={`group-tab-btn ${activeTab === "tasks" ? "active" : ""}`} onClick={() => setActiveTab("tasks")}>
                                    Tâches
                                    {notifications.tasks > 0 && <span className="notification-badge">{notifications.tasks}</span>}
                                </button>
                                <button type="button" className={`group-tab-btn ${activeTab === "members" ? "active" : ""}`} onClick={() => setActiveTab("members")}>
                                    Membres
                                </button>
                                <button type="button" className={`group-tab-btn ${activeTab === "chat" ? "active" : ""}`} onClick={() => setActiveTab("chat")}>
                                    Chat
                                    {notifications.chat > 0 && activeTab !== "chat" && <span className="notification-badge">{notifications.chat}</span>}
                                </button>
                            </div>

                            {/* Indicateur global d'activité - visible en haut */}
                            {hasActivity && (
                                <div className="activity-indicator">
                                    <span className="activity-dot" />
                                    Activité récente
                                </div>
                            )}
                        </div>

                        <div className="group-tab-content">
                            {activeTab === "tasks" && <GroupTasks groupId={selectedGroupId} currentUserId={user._id} onVisibilityChange={handleTasksVisibility} />}

                            {activeTab === "members" && <GroupMembers groupId={selectedGroupId} currentUserId={user._id} />}

                            {activeTab === "chat" && <GroupChat groupId={selectedGroupId} currentUserId={user._id} />}
                        </div>
                    </>
                ) : (
                    <div className="no-group-selected">
                        <p>Sélectionnez un groupe dans la liste ou créez-en un nouveau.</p>
                        <button type="button" className="create-group-large-btn" onClick={handleCreateGroup}>
                            Créer un groupe
                        </button>
                    </div>
                )}
            </div>

            {/* Modal de création de groupe */}
            {showCreateModal && <CreateGroupModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />}
        </div>
    );
};
