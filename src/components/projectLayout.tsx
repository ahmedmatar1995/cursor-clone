import { Navbar } from "@/features/projects/components/project-navbar";
import { Id } from "convex/_generated/dataModel";
import React from "react";
import { Allotment } from "allotment";
import "allotment/dist/style.css";

const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 800;
const DEFAULT_CONVERSATION_SIDEBAR_WIDTH = 400;
const DEFAULT_MAIN_SIZE = 1000;

interface Props {
  children: React.ReactNode;
  projectId: Id<"projects">;
}

export const ProjectLayout = ({ children, projectId }: Props) => {
  return (
    <div className="w-full h-screen flex flex-col bg-background text-foreground">
      <Navbar projectId={projectId} />
      <div className="flex-1 flex overflow-hidden">
        <Allotment
          className="flex-1"
          defaultSizes={[DEFAULT_CONVERSATION_SIDEBAR_WIDTH, DEFAULT_MAIN_SIZE]}
        >
          <Allotment.Pane
            snap
            minSize={MIN_SIDEBAR_WIDTH}
            maxSize={MAX_SIDEBAR_WIDTH}
            preferredSize={DEFAULT_CONVERSATION_SIDEBAR_WIDTH}
          >
            <div>Conversation Sidebar</div>
          </Allotment.Pane>
          <Allotment.Pane preferredSize={DEFAULT_MAIN_SIZE}>
            {children}
          </Allotment.Pane>
        </Allotment>
      </div>
    </div>
  );
};
