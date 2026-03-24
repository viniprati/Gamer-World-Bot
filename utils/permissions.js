const { getIdList } = require('./config');

const defaultStaffIds = [
    '1077723832036630528',
    '983870132063453235',
    '820041555443449856',
    '1109255544495145021'
];

function getAllowedStaffIds() {
    return getIdList('ALLOWED_STAFF_IDS', defaultStaffIds);
}

function isAllowedStaff(userId) {
    return getAllowedStaffIds().includes(String(userId));
}

module.exports = { getAllowedStaffIds, isAllowedStaff };
