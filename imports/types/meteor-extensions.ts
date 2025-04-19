declare module "meteor/meteor" {
    namespace Meteor {
        const connection: {
            _lastSessionId?: string;
        } | null;
    }
}