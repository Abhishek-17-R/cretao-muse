import { CheckCircle, Circle, Loader2 } from "lucide-react";

interface PipelineStage {
  agent: string;
  status: "pending" | "running" | "complete";
}

interface PipelineProgressProps {
  stages: PipelineStage[];
}

const PipelineProgress = ({ stages }: PipelineProgressProps) => {
  return (
    <div className="flex items-center justify-center gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
      {stages.map((stage, index) => (
        <div key={stage.agent} className="flex items-center gap-1">
          <div className="flex items-center gap-1.5">
            {stage.status === "complete" && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
            {stage.status === "running" && (
              <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
            )}
            {stage.status === "pending" && (
              <Circle className="h-4 w-4 text-muted-foreground" />
            )}
            <span
              className={`text-xs font-medium ${
                stage.status === "complete"
                  ? "text-green-500"
                  : stage.status === "running"
                  ? "text-amber-500"
                  : "text-muted-foreground"
              }`}
            >
              {stage.agent}
            </span>
          </div>
          {index < stages.length - 1 && (
            <div className={`w-8 h-0.5 mx-1 ${
              stage.status === "complete" ? "bg-green-500" : "bg-muted"
            }`} />
          )}
        </div>
      ))}
    </div>
  );
};

export default PipelineProgress;
