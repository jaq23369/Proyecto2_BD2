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
