import React, { useState, useEffect, useRef } from "react";
import { useTracker } from "meteor/react-meteor-data";
import { Meteor } from "meteor/meteor";
import { User } from "../../types/user";
import { GroupsList } from "./GroupsList";
import { GroupMembers } from "./GroupMembers";
import { GroupTasks, GroupTasksRefHandle } from "./GroupTasks";
import { GroupChat } from "./GroupChat";
import { CreateGroupModal } from "./CreateGroupModal";
import { AddTaskModal } from "../AddTaskModal";
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
    const [showAddTaskModal, setShowAddTaskModal] = useState(false);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 767);
    const groupTasksRef = useRef<GroupTasksRefHandle>(null);
    const [hideCompletedTasks, setHideCompletedTasks] = useState(false);

    useTracker(() => {
        Meteor.subscribe("messages");
        Meteor.subscribe("tasks");
        Meteor.subscribe("groups");
        return {};
    }, []);

    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth <= 767);
        };

        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
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
        setHideCompletedTasks(!showAll);
    };

    const handleGroupSelect = (groupId: string, groupName: string) => {
        setSelectedGroupId(groupId || null);
        setSelectedGroupName(groupName);
    };

    const handleBackToGroups = () => {
        setSelectedGroupId(null);
        setSelectedGroupName("");
    };

    const handleCreateGroup = () => {
        setShowCreateModal(true);
    };

    const toggleHideCompleted = () => {
        if (groupTasksRef.current && groupTasksRef.current.toggleHideCompleted) {
            groupTasksRef.current.toggleHideCompleted();
        }
    };

    return (
        <div className={`groups-container ${isMobileView && selectedGroupId ? "mobile-group-active" : ""}`}>
            <div className="groups-sidebar">
                <GroupsList currentUserId={user._id} selectedGroupId={selectedGroupId} onSelectGroup={handleGroupSelect} onCreateGroup={handleCreateGroup} />
            </div>

            <div className="groups-content">
                {selectedGroupId ? (
                    <>
                        <div className="group-header">
                            <div className="group-header-content">
                                <h2>{selectedGroupName}</h2>
                                {isMobileView && (
                                    <button type="button" className="back-to-groups-btn" onClick={handleBackToGroups} title="Retour à la liste des groupes">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        Groupes
                                    </button>
                                )}
                            </div>
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
                        </div>

                        <div className="group-tab-content">
                            {activeTab === "tasks" && (
                                <>
                                    <GroupTasks ref={groupTasksRef} groupId={selectedGroupId} currentUserId={user._id} onVisibilityChange={handleTasksVisibility} disableMobileControls={true} />

                                    {showAddTaskModal && <AddTaskModal isOpen={true} onClose={() => setShowAddTaskModal(false)} groupId={selectedGroupId} />}

                                    <button className="mobile-add-task-button" onClick={() => setShowAddTaskModal(true)}>
                                        +
                                    </button>
                                    <button className="mobile-visibility-toggle" onClick={toggleHideCompleted} title={!hideCompletedTasks ? "Afficher toutes les tâches" : "Masquer les tâches terminées"}>
                                        <img src={!hideCompletedTasks ? "/icons/eye/open.png" : "/icons/eye/closed.png"} alt={!hideCompletedTasks ? "Afficher toutes les tâches" : "Masquer les tâches terminées"} />
                                    </button>
                                </>
                            )}

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

            {showCreateModal && <CreateGroupModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />}
        </div>
    );
};
