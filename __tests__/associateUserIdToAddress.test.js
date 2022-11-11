const axios = require('axios');
const associateUserIdToAddress = require('../associateUserIdToAddress');
const MockAdapter = require("axios-mock-adapter");

describe('associateUserIdToAddress.js', () => {
	beforeAll(() => {
		mock = new MockAdapter(axios);
	});

	beforeEach(() => {
		mock.reset();
	});

	it('should resolve with txnHash and issueId when given it with status code 200', async () => {
		const expectedData = { txnHash: "0xsf", userId: "userId" };
		mock.onPost('http://openq-user-registration:8091').reply(200, expectedData);
		const result = await associateUserIdToAddress('userId', 'userAddress', 'oauthToken');
		const { data } = result;
		await expect(data).toEqual(expectedData);
	});
});