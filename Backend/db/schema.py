LABELS: set[str] = {
    "User",
    "Post",
    "Comment",
    "Hashtag",
    "Group",
    "Message",
    "Media",
    "Notification",
}

RELATIONSHIP_TYPES: set[str] = {
    "FOLLOWS",
    "BLOCKED",
    "MEMBER_OF",
    "POSTED",
    "LIKED",
    "COMMENTED",
    "SENT",
    "TAGGED_WITH",
    "CONTAINS",
    "REPLIED_TO",
    "HAS_MEDIA",
    "RECEIVED",
    "ABOUT",
    "SAVED",
    "SHARED_IN",
}

LABEL_PROPERTIES: dict[str, set[str]] = {
    "User": {
        "userId", "username", "email", "bio", "profilePicUrl",
        "isVerified", "followersCount", "followingCount",
        "interests", "birthDate", "createdAt",
    },
    "Post": {
        "postId", "content", "location", "mediaUrls", "isPublic",
        "likesCount", "commentsCount", "createdAt", "updatedAt",
    },
    "Comment": {
        "commentId", "content", "isEdited", "likesCount",
        "sentiment", "createdAt", "updatedAt",
    },
    "Hashtag": {
        "name", "postsCount", "followersCount", "isTrending",
        "relatedTopics", "createdAt",
    },
    "Group": {
        "groupId", "name", "description", "isPrivate",
        "membersCount", "categories", "createdAt",
    },
    "Message": {
        "messageId", "content", "isRead", "mediaUrl",
        "reactionType", "sentAt", "readAt",
    },
    "Media": {
        "mediaId", "url", "type", "sizeKB", "format", "uploadedAt",
    },
    "Notification": {
        "notificationId", "type", "isRead", "priority",
        "message", "createdAt",
    },
}

RELATIONSHIP_PROPERTIES: dict[str, set[str]] = {
    "FOLLOWS": {"since", "notificationsEnabled", "mutualFriendsCount"},
    "BLOCKED": {"blockedAt", "reason", "isPermanent"},
    "MEMBER_OF": {"joinedAt", "role", "contributionScore"},
    "POSTED": {"postedAt", "device", "location"},
    "LIKED": {"likedAt", "reactionType", "isActive"},
    "COMMENTED": {"commentedAt", "isFirstComment", "device"},
    "SENT": {"sentAt", "isEncrypted", "channel"},
    "TAGGED_WITH": {"taggedAt", "relevanceScore", "isPrimary"},
    "CONTAINS": {"addedAt", "isVisible", "moderationStatus"},
    "REPLIED_TO": {"repliedAt", "isDirectMention", "notifiedParent"},
    "HAS_MEDIA": {"attachedAt", "isPrimary", "caption"},
    "RECEIVED": {"receivedAt", "isRead", "notificationType"},
    "ABOUT": {"linkedAt", "context", "targetType"},
    "SAVED": {"savedAt", "note", "isPrivate"},
    "SHARED_IN": {"sharedAt", "caption", "visibleToMembers"},
}

ID_PROPERTY: dict[str, str] = {
    "User": "userId",
    "Post": "postId",
    "Comment": "commentId",
    "Hashtag": "name",
    "Group": "groupId",
    "Message": "messageId",
    "Media": "mediaId",
    "Notification": "notificationId",
}

NODE_PROPERTY_TYPES: dict[str, dict[str, str]] = {
    "User": {
        "userId": "string", "username": "string", "email": "string",
        "bio": "string", "profilePicUrl": "string", "isVerified": "boolean",
        "followersCount": "integer", "followingCount": "integer",
        "interests": "list", "birthDate": "date", "createdAt": "date",
    },
    "Post": {
        "postId": "string", "content": "string", "location": "string",
        "mediaUrls": "list", "isPublic": "boolean", "likesCount": "integer",
        "commentsCount": "integer", "createdAt": "date", "updatedAt": "date",
    },
    "Comment": {
        "commentId": "string", "content": "string", "isEdited": "boolean",
        "likesCount": "integer", "sentiment": "string", "createdAt": "date",
        "updatedAt": "date",
    },
    "Hashtag": {
        "name": "string", "postsCount": "integer", "followersCount": "integer",
        "isTrending": "boolean", "relatedTopics": "list", "createdAt": "date",
    },
    "Group": {
        "groupId": "string", "name": "string", "description": "string",
        "isPrivate": "boolean", "membersCount": "integer",
        "categories": "list", "createdAt": "date",
    },
    "Message": {
        "messageId": "string", "content": "string", "isRead": "boolean",
        "mediaUrl": "string", "reactionType": "string", "sentAt": "date",
        "readAt": "date",
    },
    "Media": {
        "mediaId": "string", "url": "string", "type": "string",
        "sizeKB": "float", "format": "string", "uploadedAt": "date",
    },
    "Notification": {
        "notificationId": "string", "type": "string", "isRead": "boolean",
        "priority": "string", "message": "string", "createdAt": "date",
    },
}

RELATIONSHIP_PROPERTY_TYPES: dict[str, dict[str, str]] = {
    "FOLLOWS": {"since": "date", "notificationsEnabled": "boolean", "mutualFriendsCount": "integer"},
    "BLOCKED": {"blockedAt": "date", "reason": "string", "isPermanent": "boolean"},
    "MEMBER_OF": {"joinedAt": "date", "role": "string", "contributionScore": "float"},
    "POSTED": {"postedAt": "date", "device": "string", "location": "string"},
    "LIKED": {"likedAt": "date", "reactionType": "string", "isActive": "boolean"},
    "COMMENTED": {"commentedAt": "date", "isFirstComment": "boolean", "device": "string"},
    "SENT": {"sentAt": "date", "isEncrypted": "boolean", "channel": "string"},
    "TAGGED_WITH": {"taggedAt": "date", "relevanceScore": "float", "isPrimary": "boolean"},
    "CONTAINS": {"addedAt": "date", "isVisible": "boolean", "moderationStatus": "string"},
    "REPLIED_TO": {"repliedAt": "date", "isDirectMention": "boolean", "notifiedParent": "boolean"},
    "HAS_MEDIA": {"attachedAt": "date", "isPrimary": "boolean", "caption": "string"},
    "RECEIVED": {"receivedAt": "date", "isRead": "boolean", "notificationType": "string"},
    "ABOUT": {"linkedAt": "date", "context": "string", "targetType": "string"},
    "SAVED": {"savedAt": "date", "note": "string", "isPrivate": "boolean"},
    "SHARED_IN": {"sharedAt": "date", "caption": "string", "visibleToMembers": "boolean"},
}
