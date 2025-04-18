import { Meteor } from "meteor/meteor";

Meteor.publish('onlineUsers', function () {
    if (!this.userId) {
        return this.ready();
    }


    return Meteor.users.find(
        { _id: { $ne: this.userId } },
        {
            fields: {
                username: 1,
                profile: 1,
                status: 1
            }
        }
    );
});