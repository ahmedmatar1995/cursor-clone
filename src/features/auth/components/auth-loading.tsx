import { Spinner } from "@/components/ui/spinner";

export const LoadingAuth = () => {
  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <div className="w-full max-w-lg flex flex-col items-center gap-y-4">
        <Spinner className="size-6" />
      </div>
    </div>
  );
};
