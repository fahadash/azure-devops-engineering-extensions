import tl = require('azure-pipelines-task-lib/task');
import { AzureApi } from './azureApi';
import * as azureGitInterfaces from "azure-devops-node-api/interfaces/GitInterfaces";
import { EnvironmentConfigurations } from './environmentConfigurations';
import { Build } from './build';
let fs = require('fs');
import messages from './user_messages.json';
import * as azureBuildInterfaces from "azure-devops-node-api/interfaces/BuildInterfaces";
import { Branch } from './branch';

async function run() {
    try {
        const pastFailureThreshold: number = 2; 
        const numberBuildsToQuery: number = 10;
        const desiredBuildReasons: number = azureBuildInterfaces.BuildReason.BatchedCI + azureBuildInterfaces.BuildReason.IndividualCI;
        const desiredBuildStatus: number = azureBuildInterfaces.BuildStatus.Completed;
        let configurations: EnvironmentConfigurations = new EnvironmentConfigurations();
        let azureApi: AzureApi = new AzureApi(configurations.getTeamURI(), configurations.getAccessKey());
        let currentProject: string = configurations.getProjectName();
        let currentBuildId: number = configurations.getBuildId();
        let currentBuild: Build = new Build(await azureApi.getBuild(currentProject, currentBuildId));

        if (!configurations.getPullRequestId()){
            tl.debug(messages.notInPullRequestMessage)
        }
        else if (!currentBuild.willFail(await azureApi.getBuildTimeline(currentProject, currentBuildId))){
            tl.debug(messages.noFailureMessage);
        }
        else {
            let retrievedBuilds: Array<azureBuildInterfaces.Build> = await azureApi.getBuilds(currentProject, new Array(currentBuild.getDefinitionId()), desiredBuildReasons, desiredBuildStatus, numberBuildsToQuery, configurations.getTargetBranch());
            let targetBranch: Branch = new Branch(configurations.getTargetBranch(), convertBuildData(retrievedBuilds));
            if (tooManyBuildsFailed(targetBranch.getBuildFailStreak(), pastFailureThreshold)){
                    postBuildFailuresComment(azureApi, targetBranch, configurations.getPullRequestId(), configurations.getRepository(), configurations.getProjectName());
            }
        }   
    }
    catch (err) {
        console.log("error!", err); 
    }
}

function convertBuildData(retrievedBuildsData: azureBuildInterfaces.Build[]): Build[] {
    let builds: Array<Build> = [];
    for (let numberBuild = 0; numberBuild < retrievedBuildsData.length; numberBuild++){
        builds[numberBuild] = new Build(retrievedBuildsData[numberBuild]);
    }
    return builds;
}


function tooManyBuildsFailed(failedBuilds: number, pastFailureThreshold: number){
    return failedBuilds >= pastFailureThreshold;
}

function postBuildFailuresComment(azureApi: AzureApi, targetBranch: Branch, pullRequestId: number, repository: string, project: string): void {
    let mostRecentTargetFailedBuild = targetBranch.getMostRecentFailedBuild();
    if (mostRecentTargetFailedBuild !== null){
       let thread: azureGitInterfaces.CommentThread = {comments: new Array({content: format(messages.buildFailureComment, mostRecentTargetFailedBuild.getLink(),  String(targetBranch.getBuildFailStreak()),  targetBranch.getName())})};
       azureApi.postNewCommentThread(thread, pullRequestId, repository, project);
       tl.debug(messages.commentCompletedMessage);
    }
}

function format(text: string, ...args: string[]): string {
    return text.replace(/{(\d+)}/g, (match, num) => {
      return typeof args[num] !== 'undefined' ? args[num] : match;
    });
  }

run();