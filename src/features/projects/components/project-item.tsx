import { Link } from "@tanstack/react-router";
import { Doc } from "convex/_generated/dataModel";
import { AlertCircleIcon, GlobeIcon, Loader2Icon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { FaGithub } from "react-icons/fa";

interface Props {
  data: Doc<"projects">;
}

export const formatTimeStamp = (timestamp: number) => {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
};

export const getProjectIcon = (data: Doc<"projects">) => {
  if (data.importStatus === "completed") {
    return <FaGithub className="size-4 text-muted-foreground" />;
  }
  if (data.importStatus === "failed") {
    return <AlertCircleIcon className="size-4 text-muted-foreground" />;
  }
  if (data.importStatus === "importing") {
    return <Loader2Icon className="size-4 text-muted-foreground" />;
  }
  return <GlobeIcon className="size-4 text-muted-foreground" />;
};

export const ProjectItem = ({ data }: Props) => {
  return (
    <Link
      to={"/projects/" + data._id}
      className="text-xs text-foreground/60 font-medium hover:text-foreground py-1 flex items-center justify-between w-full group"
    >
      <div className="flex items-center gap-2">
        {getProjectIcon(data)}
        <span className="text-xs truncate">{data.name}</span>
      </div>
      <span className="text-xs text-muted-foreground group-hover:text-foreground/60 transition-colors">
        {formatTimeStamp(data.updatedAt)}
      </span>
    </Link>
  );
};
