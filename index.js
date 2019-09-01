const path = require('path');
const assert = require('assert');
const appRootPath = require('app-root-path');
const request = require('request-promise-native');

module.exports = class AresApi {

  static set debug(val) {
    this.debugOn = val;
  }
  
  static log(...vals){
    for(let val of vals){
      console.log(val);
    }
  }

  static setProjectInfo(info){
    if(typeof info === 'string' && info.indexOf('.json')){
      info = require(path.join(appRootPath + '', info));
    }
    assert(info.userToken, 'You must provide a userToken (from your ARES account');
    assert(info.workspaceName, 'You must provide a workspaceName (from your ARES account');
    assert(info.projectKey, 'You must provide a projectKey (from your ARES account');
    assert(info.projectName, 'You must provide a projectName (from your ARES account');
    // From normalized camelcased property names to ARES idosyncratic property names
    info.token = info.userToken;
    delete info.userToken;
    info.ws_name = info.workspaceName;
    delete info.workspaceName;
    info.project_key = info.projectKey;
    delete info.projectKey;
    info.project_name = info.projectName;
    delete info.projectName;
    // Set productName to project_name if not provided
    info.productName = info.productName || info.project_name;
    // Save two version of the info (to be used with different endpoints)
    this.projectInfo = {...info};
    delete this.projectInfo.project_key;
    delete this.projectInfo.productName;
    this.projectInfoForTestData = {...info};
    delete this.projectInfoForTestData.token;
    delete this.projectInfoForTestData.project_key;
    delete this.projectInfoForTestData.ws_name;
    delete this.projectInfoForTestData.project_name;
    // Also safe a special header to be used for test data
    this.headerForTestData = {
      usertoken: info.token,
      projectid: info.project_key
    }
    // Debug info
    this.debugOn && this.log(
      '\n\n\n',
      '----------------------------------------------------------------------',
      '\nFUNCTION CALLED:', 
      'setProjectInfo', 
      '\n\nWE STORED this.projectInfo:\n',
      this.projectInfo, 
      '\n\nAND this.headersForTestData:\n',
      this.headerForTestData,
      '\n\nAND this.projectInfoForTestData:\n',
      this.projectInfoForTestData,
      '\n',
      '----------------------------------------------------------------------',
      '\n\n\n',
    );
  }

  static async callServer(funcName, endPoint, data){
    let headers = endPoint === 'addgraphdata' ? this.headerForTestData : {};
    let projectInfo = endPoint !== 'addgraphdata' ? this.projectInfo : this.projectInfoForTestData;
    let said = {
      url:  'https://www.testastra.com/graph/' + endPoint,
      method: 'post',
      json: true,
      headers: headers,
      body: {
        ...projectInfo,
        ...data
      }
    };
    let answer = await request(said);
    // Debug info
    this.debugOn && this.log(
      '\n\n\n',
      '----------------------------------------------------------------------',
      '\nFUNCTION CALLED:', 
      funcName, 
      '\n\nWE TOLD ARES:\n',
      said, 
      '\n\nARES RESPONDED:\n',
      answer,
      '\n',
      '----------------------------------------------------------------------',
      '\n\n\n',
    );
    return answer;
  }

  static async startTests(){
    // Call the ARES server
    let answer = await this.callServer('startTests', 'createrunid', {status: 'started'});
    // Store the run id
    this.projectInfo.runId = answer.data[0].runId;
    this.projectInfoForTestData.runId =  answer.data[0].runId;
  }

  static async startModule(data){
    assert(data.moduleName, 'You must provide a moduleName - of your choice.');
    assert(data.totalTests, 'You must provide totalTests - the total number of tests in the module.');
    // Set a memory for totaltests per module
    // (so that this doesn't have to specified when ending a module)
    this.totalTestsPerModule = this.totalTestsPerModule || {};
    this.totalTestsPerModule[data.moduleName] = data.totalTests;
    // From normalized camelcased property names to ARES idosyncratic property names
    data.module_name = data.moduleName;
    delete data.moduleName;
    data.totaltests = data.totalTests;
    delete data.totalTests;
    // Call the ARES server
    await this.callServer('startModule', 'addmoduledata', {
      status: 'started' ,
      starttime: Math.round(Date.now()/1000) + '',
      ...data
    });
  }

  static async testResult(data){
    assert(data.moduleName, 'You must provide a moduleName - same as you used with startModule');
    assert(data.title, 'You must provide a title  - of your choice for the test');
    assert(data.passed !== undefined, 'You must provide passed  - true for PASSED, false for FAILED');
    assert(data.passed || data.errorMessage, 'You must provide an errorMessage for a test that fails');
    // From normalized camelcased property names to ARES idosyncratic property names
    data.testStatus =  data.passed ? 'PASSED' : 'FAILED';
    delete data.passed;
    data.testcaseTitle = data.title;
    delete data.title;
    // The ARES server requires a lot of mandatory properties (that can be set to empty)
    data = {
      testDate: new Date(),
      testStartTime: new Date(),
      testEndTime: new Date(),
      testData: '',
      failStacktrace: '',
      testBrowser: '-',
      testMachine: '',
      testDevice: '',
      testOs: '',
      testSuite: '',
      imageLink: '',
      videoLink: '',
      runBy: '',
      errorMessage: '',
      executionMode: '',
      failType: '',
      ...this.projectInfoForTestData,
      ...data
    };
    // The ARES server requires the data to be wrapped in a graphData property
    data = {graphData: data};
    // Call the ARES server
    await this.callServer('testResult', 'addgraphdata', data);
  }

  static async endModule(data){
    assert(data.moduleName, 'You must provide a moduleName - of your choice.');
    // Retreive totaltests
    data.totaltests = this.totalTestsPerModule[data.moduleName];
    // From normalized camelcased property names to ARES idosyncratic property names
    data.module_name = data.moduleName;
    delete data.moduleName;
    // Call the ARES server
    await this.callServer('endModule', 'addmoduledata', {
      status: 'ended',
      endtime: Math.round(Date.now()/1000) + '',
      ...data
    });
  }

  static async endTests(){
    // Call the ARES server
    delete this.projectInfo.runId;
    delete this.projectInfoForTestData.runId;
    await this.callServer('endTests', 'createrunid', {status: 'ended'});
  }

}
