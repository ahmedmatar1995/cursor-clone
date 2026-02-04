import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Doc } from "convex/_generated/dataModel";
import { getProjectIcon } from "./project-item";
import { formatTimeStamp } from "./project-item";
import { ArrowRightIcon } from "lucide-react";

interface Props {
  data: Doc<"projects">;
}

export const ContinueCard = ({ data }: Props) => {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-muted-foreground">Last Updated</span>
      <Button
        variant="outline"
        asChild
        className="h-auto flex flex-col gap-2 items-start justify-start p-4 rounded-none border"
      >
        <Link to={"/projects/" + data._id} className="group">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {getProjectIcon(data)}
              <span className="text-xs font-medium truncate">{data.name}</span>
            </div>
            <ArrowRightIcon className="size-4 text-muted-foreground group-hover:text-foreground/60 transition-color" />
          </div>
          <span className="text-xs text-muted-foreground group-hover:text-foreground/60 transition-color">
            {formatTimeStamp(data.updatedAt)}
          </span>
        </Link>
      </Button>
    </div>
  );
};
