export interface LabelData {
    id: string;
    name: string;
    color: string;
    boardId: string;
}

export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
}

export interface Notification {
    id: string;
    userId: string;
    type: string;
    payload: any;
    read: boolean;
    createdAt: string;
}

export interface CommentData {
    id: string;
    text: string;
    createdAt: string;
    user: {
        id: string;
        name: string;
        avatar?: string;
    };
}

export interface Card {
    id: string;
    title: string;
    description?: string;
    order: number;
    listId: string;
    comments?: CommentData[];
    labels?: {
        label: LabelData;
    }[];
    assignees?: {
        user: {
            id: string;
            name: string;
            avatar?: string;
        };
    }[];
    dueDate?: string;
    isDone?: boolean;
}

export interface List {
    id: string;
    title: string;
    order: number;
    cards: Card[];
}

export interface BoardMember {
    id: string;
    role: string;
    userId: string;
    user: {
        id: string;
        name: string;
        avatar?: string;
        email?: string;
    };
}

export interface Board {
    id: string;
    title: string;
    description?: string;
    bgImage?: string;
    bgColor?: string;
    lists?: List[];
    ownerId: string;
    owner?: {
        name: string;
        avatar?: string;
    };
    members?: BoardMember[];
    labels?: LabelData[];
    isStarred?: boolean;
    order?: number;
}
