import { IPipeline } from "./IPipeline";
import * as azureBuildInterfaces from "azure-devops-node-api/interfaces/BuildInterfaces";

export class Build implements IPipeline{

    private buildData: azureBuildInterfaces.Build; 
    private timelineData: azureBuildInterfaces.Timeline;

    constructor(buildData: azureBuildInterfaces.Build, timelineData: azureBuildInterfaces.Timeline) {
        this.buildData = buildData;
        this.timelineData = timelineData;
    }

    public isFailure() : boolean {
        if (this.isComplete()){
            return this.buildData.result === azureBuildInterfaces.BuildResult.Failed;
        }
        for (let taskRecord of this.timelineData.records){
            if (this.taskFailed(taskRecord)){
                return true;
            }
        }
        return false;
    }

    public isComplete(): boolean {
        return this.buildData.status === azureBuildInterfaces.BuildStatus.Completed;
    }

    public getDefinitionId(): number {
        return Number(this.buildData.definition.id);
    }

    public getLink(): string {
        return String(this.buildData._links.web.href);
    }

    public getId(): number {
        return Number(this.buildData.id); 
    }

    public getDisplayName(): string {
        return this.buildData.buildNumber;
    }

    public getTaskLength(taskId: string): number | null{
        for (let taskRecord of this.timelineData.records) {
            if (taskRecord.id === taskId && taskRecord.state === azureBuildInterfaces.TimelineRecordState.Completed){
                return taskRecord.finishTime.valueOf() - taskRecord.startTime.valueOf();
            }
        }
        return null;
    }

    public getTaskIds(): string[] {
        let taskIds: string[] = [];
        for (let taskRecord of this.timelineData.records) {
            taskIds.push(taskRecord.id);
        }
        return taskIds;
    }

    public getLongRunningValidations(taskThresholdTimes: Map<string, number>): Map<string, number> {
        let longRunningValidations: Map<string, number> = new Map(); 
        for (let taskId of this.getTaskIds()) {
            if (taskThresholdTimes.has(taskId) && this.getTaskLength(taskId) > taskThresholdTimes.get(taskId)) {
                longRunningValidations.set(taskId, this.getTaskLength(taskId));
            }
        }
        return longRunningValidations;
    }

    private taskFailed(task: azureBuildInterfaces.TimelineRecord): boolean {
        return task.state === azureBuildInterfaces.TimelineRecordState.Completed && task.result === azureBuildInterfaces.TaskResult.Failed; 
    }
} 