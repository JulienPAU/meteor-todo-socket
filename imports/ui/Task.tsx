import React from "react";

interface TaskProps {
    task: { text: string };
}

export const Task = ({ task }: TaskProps) => {
    return <li>{task.text}</li>;
};
