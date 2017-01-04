const DEFAULT_STATE = {
  testingStoreCount: 0,
  testingStoreCount2: 0,
  requests: {
    waiting: false,
    error: null,
  },
};

export default function uiReducer(state = DEFAULT_STATE, action) {
  var newState = {};

  switch(action.type) {
    case 'REQUESTS_BEGIN':
      newState = {
        requests: {
          waiting: true,
          error: null,
        },
      };
      break;

    case 'REQUESTS_END':
      newState = {
        requests: { waiting: false },
      };
      break;

    case 'REQUEST_ERROR':
      newState = {
        requests: { error: action.error },
      };
      break;

    case 'TEST_COUNT':
      newState = { testingStoreCount: action.count };
      break;

    case 'TEST_COUNT2':
      newState = { testingStoreCount2: action.count };
      break;
  }

  return Object.assign({}, state, newState);
}
