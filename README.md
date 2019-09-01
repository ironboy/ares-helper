# ares-helper
Simplifies communication from Node.js to the API for the www.testastra.com/ares dashboard

## What is ARES? (www.testastra.com/ares)
ARES (TOOL AGNOSTIC TEST AUTOMATION DASHBOARD) is a Dashboard for test reports. It is a nice Dashboard with a REST-api.

The REST api has its downsides - non-consequent naming of properties (camelcase and underscore) mixed, and many properties that are mandatory to send even if they often are empty/unnecessary.

That's the reason for this module - it's simplifies communication with ARES from Node.js.

## Basic principles of communication
In order to report your test to ARES you must first create an account at https://www.testastra.com/ares.

You then tell ARES to start a test run, start a module within that test run, report test results within that module, end reports within that module and end the test run.

(If you want to can set up your system to run several modules in parallell.)

## Installation

Install this module:

```
npm install ares-helper
```

and then use it in your scripts:

```js
const ares = require('ares-helper');
```

## Create a json file with your ARES account and project details
You could call the json file *ares-config.json* and put it at root level in your Node.js project. The structure of the file should look like this

```json
{
  "userToken": "user token copied from the ARES website",
  "workspaceName": "workspace name copied from the ARES website",
  "projectKey": "projekt key copied from the ARES website",
  "projectName": "projeft name copied from the ARES website"
}
```

## API/methods

### ares.setProjectInfo(path to json)

```js
ares.setProjectInfo('ares-config.json');
```

Sets the basic project info by pointing to a JSON file. 

(Alternatively you can send the json data directly to the method.)

### ares.startTests();

Start a test run:

```js
await ares.startTests();
```

### ares.startModule({...})

Start a module within the test run:

```js
await ares.startModule({
  moduleName: 'A name of your own choice',
  totalTests: 3 // Total number of tests in the module
})
```

### ares.testResult({})

Save a test result for a test within a module:

```js
await ares.testResult({
  moduleName: 'A name of a module you have started',
  title: 'The name of the test',
  passed: false, // true = passed or false = failed
  errorMessage: 'Provide an errormessge if failed'
});
```

#### More options
**Please note:** You can provide much more info if you want. Additional properties you can use are: *testData, failStacktrace, testBrowser, testMachine, testDevice, testOs, testSuite, imageLink, videoLink, runBy, errorMessage, executionMode* and *failType*.

### ares.endModule({})

When you have reported all test results within a module:

```js
await ares.endModule({
  moduleName: 'The name of the module you want to end'
});
```

### ares.endTests()

When the whole test run is done:

```js
await ares.endTests()
```

## Debugging
If you want to debug what happens in the communication between your application and the ARES server:

```
ares.debug = true;
```

This will output a verbose log to the console.

## Example code

This is some example code to quickly test that communication works. (However normally, in a real-life scenario, you would spread your calls to **ares** throughout different test steps and files...)

```js
const ares = require('ares-helper');

async function tryItOut(){

  ares.debug = true;

  ares.setProjectInfo('ares-config.json');

  await ares.startTests();

  await ares.startModule({
    moduleName: 'Dummy module 1',
    totalTests: 3
  });

  await ares.testResult({
    moduleName: 'Dummy module 1',
    title: 'Test 1',
    passed: true
  });

  await ares.testResult({
    moduleName: 'Dummy module 1',
    title: 'Test 2',
    passed: false,
    errorMessage: 'Could not compute!'
  });

  await ares.testResult({
    moduleName: 'Dummy module 1',
    title: 'Test 3',
    passed: true
  });

  await ares.endModule({
    moduleName: 'Dummy module 1',
  });

  await ares.endTests();

}

tryItOut();
```
