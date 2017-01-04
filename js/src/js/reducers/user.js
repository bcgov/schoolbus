const TEST_STATE = {
  userId                  : 1,
  firstName               : 'Rob',
  lastName                : 'Chamberlin',
  fullName                : 'Rob Chamberlin',
  districtName            : 'Cariboo',
  overdueInspections      : 0,
  scheduledReinspections  : 5,
  dueNextMonthInspections : 22,
};

const DEFAULT_STATE = {
  userId                  : null,
  firstName               : null,
  lastName                : null,
  fullName                : null,
  districtName            : null,
  overdueInspections      : 0,
  scheduledReinspections  : 0,
  dueNextMonthInspections : 0,
};

export default function userReducer(state = TEST_STATE, action) {
  var newState = {};

  switch(action.type) {
    case 'UPDATE_USER':
      newState = Object.assign({}, state, action.user);
      break;
  }

  return Object.assign({}, state, newState);
}
