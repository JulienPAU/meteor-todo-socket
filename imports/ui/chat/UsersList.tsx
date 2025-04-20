import React from "react";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import { MessagesCollection } from "/imports/api/MessagesCollection";

interface User {
  _id: string;
  username?: string;
  profile?: {
    name?: string;
  };
  status?: {
    online: boolean;
    lastActivity?: Date;
  };
}

interface UsersListProps {
  currentUserId: string;
  selectedUserId: string | null;
  onSelectUser: (userId: string, username: string) => void;
}

export const UsersList = ({
  currentUserId,
  selectedUserId,
  onSelectUser
}: UsersListProps) => {
  const { users, unreadCounts } = useTracker(() => {
    const usersList = Meteor.users
      .find({
        _id: { $ne: currentUserId }
      })
      .fetch();

    const counts: Record<string, number> = {};

    for (const user of usersList) {
      const count = MessagesCollection.find({
        senderId: user._id,
        receiverId: currentUserId,
        read: false
      }).count();

      counts[user._id] = count;
    }

    return {
      users: usersList,
      unreadCounts: counts
    };
  });

  const getInitial = (user: User) => {
    const username = user.username || user.profile?.name || "U";
    return username.charAt(0).toUpperCase();
  };

  const getDisplayName = (user: User) => {
    return user.username || user.profile?.name || "Utilisateur";
  };

  const isUserOnline = (user: User) => {
    return user.status?.online === true;
  };

  return (
    <div className="users-list">
      <h2>Conversations</h2>
      {users.length === 0 ? (
        <div className="empty-users-message">
          Aucun utilisateur disponible pour le moment
        </div>
      ) : (
        users.map((user: User) => (
          <div
            key={user._id}
            className={`user-item ${
              selectedUserId === user._id ? "active" : ""
            } ${unreadCounts[user._id] > 0 ? "unread" : ""}`}
            onClick={() => onSelectUser(user._id, getDisplayName(user))}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                onSelectUser(user._id, getDisplayName(user));
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Conversation avec ${getDisplayName(user)}`}
          >
            <div className="user-avatar">{getInitial(user)}</div>
            <div className="user-info">
              <div className="user-name">
                {getDisplayName(user)}
                {isUserOnline(user) && (
                  <span className="online-indicator" title="En ligne"></span>
                )}
              </div>
            </div>
            {unreadCounts[user._id] > 0 && (
              <div
                className="unread-count"
                title={`${unreadCounts[user._id]} message(s) non lu(s)`}
              >
                {unreadCounts[user._id]}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};
