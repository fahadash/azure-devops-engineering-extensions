"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var Build_1 = require("../Build");
var sinon = __importStar(require("sinon"));
var Branch_1 = require("../Branch");
describe('Branch Tests', function () {
    var failedBuildOne;
    var successfulBuildTwo;
    var failedBuildThree;
    var successfulBuildFour;
    var incompleteBuild;
    var branch;
    beforeEach(function () {
        failedBuildOne = new Build_1.Build(null, null);
        successfulBuildTwo = new Build_1.Build(null, null);
        failedBuildThree = new Build_1.Build(null, null);
        successfulBuildFour = new Build_1.Build(null, null);
        incompleteBuild = new Build_1.Build(null, null);
        var builds = [failedBuildOne, successfulBuildTwo, failedBuildThree, successfulBuildFour];
        for (var buildNumber = 0; buildNumber < builds.length; buildNumber++) {
            sinon.stub(builds[buildNumber], "getId").returns(buildNumber);
            sinon.stub(builds[buildNumber], "isComplete").returns(true);
        }
        sinon.stub(failedBuildOne, "isFailure").returns(true);
        sinon.stub(failedBuildThree, "isFailure").returns(true);
        sinon.stub(successfulBuildTwo, "isFailure").returns(false);
        sinon.stub(successfulBuildFour, "isFailure").returns(false);
        sinon.stub(incompleteBuild, "isComplete").returns(false);
    });
    test("Counts pipeline failure streak of multiple fails", function () {
        branch = new Branch_1.Branch("", [failedBuildOne, failedBuildOne, failedBuildOne, failedBuildOne, successfulBuildTwo, successfulBuildTwo]);
        expect(branch.getPipelineFailStreak()).toEqual(4);
    });
    test("Does not count any pipeline failure streak when first pipeline does not fail", function () {
        branch = new Branch_1.Branch("", [successfulBuildTwo, failedBuildOne, failedBuildOne, failedBuildOne, failedBuildOne]);
        expect(branch.getPipelineFailStreak()).toEqual(0);
    });
    test("Does not count any pipeline failure streak when no pipelines fail", function () {
        branch = new Branch_1.Branch("", [successfulBuildTwo, successfulBuildTwo, successfulBuildTwo]);
        expect(branch.getPipelineFailStreak()).toEqual(0);
    });
    test("Gets most recently completed pipeline", function () {
        branch = new Branch_1.Branch("", [failedBuildOne, failedBuildThree, successfulBuildTwo]);
        expect(branch.getMostRecentCompletePipeline()).toEqual(failedBuildOne);
        expect(branch.getMostRecentCompletePipeline()).not.toEqual(failedBuildThree);
    });
    test("Gets most recently completed pipeline when first is not finished", function () {
        branch = new Branch_1.Branch("", [incompleteBuild, failedBuildOne]);
        expect(branch.getMostRecentCompletePipeline()).toEqual(failedBuildOne);
    });
    test("Gets no pipeline when no pipelines are complete", function () {
        branch = new Branch_1.Branch("", [incompleteBuild]);
        expect(branch.getMostRecentCompletePipeline()).toBeNull();
    });
    test("Too many pipelines failed when when failure streak of pipelines is larger than threshold", function () {
        branch = new Branch_1.Branch("", [failedBuildOne, failedBuildOne, failedBuildOne, failedBuildOne, successfulBuildTwo, successfulBuildTwo]);
        expect(branch.tooManyPipelinesFailed(2)).toBe(true);
    });
    test("Too many pipelines failed is false when failure streak of pipelines is shorter than threshold", function () {
        branch = new Branch_1.Branch("", [failedBuildOne, failedBuildOne, successfulBuildTwo, successfulBuildTwo]);
        expect(branch.tooManyPipelinesFailed(2)).toBe(true);
    });
});