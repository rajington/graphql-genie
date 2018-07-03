import { InMemoryCache, IntrospectionFragmentMatcher, IntrospectionResultData } from 'apollo-cache-inmemory';
import { ApolloClient } from 'apollo-client';
import { SchemaLink } from 'apollo-link-schema';
import indexedDBAdapter from 'fortune-indexeddb';
import { graphql, subscribe } from 'graphql';
import { FortuneOptions, GraphQLGenie } from '../../../src/index';

const typeDefs = `

# This is sample IDL schema for GraphQL Genie.
#


interface Submission {
	id: ID! @unique
	text: String!
	author: User @relation(name: "SubmissionsByUser")
}

type Story implements Submission @model {
	id: ID! @unique
	title: String!
	text: String!
	author: User @relation(name: "SubmissionsByUser")
	likedBy: [User!] @connection @relation(name: "LikedSubmissions")
}

type Comment implements Submission @model {
	id: ID! @unique
	text: String!
	author: User @relation(name: "SubmissionsByUser")
	approved: Boolean @default(value: "true")
}

type User @model {
	id: ID! @unique
	email: String @unique
	name: String
	submissions: [Submission!] @relation(name: "SubmissionsByUser")
	address: Address
	liked: [Submission!] @connection @relation(name: "LikedSubmissions")
	created: DateTime @createdTimestamp
	updated: DateTime @updatedTimestamp
}

type Address @model {
	id: ID! @unique
	city: String!
	user: User
}




`;

const fortuneOptions: FortuneOptions = {
	settings: { enforceLinks: true },
	adapter: [ indexedDBAdapter, {
		// Name of the IndexedDB database to use. Defaults to `fortune`.
		name: 'fortune'
	} ]
};
const genie = new GraphQLGenie({ typeDefs, fortuneOptions, generatorOptions: {
	generateGetAll: true,
	generateCreate: true,
	generateUpdate: true,
	generateDelete: true,
	generateUpsert: true
}});
const buildClient = async (genie: GraphQLGenie) => {
	try {
		await genie.init();
	} catch (e) {
		console.error('genie error');
		console.error(e);
	}

	const schema = genie.getSchema();
	const introspectionQueryResultData = <IntrospectionResultData>await genie.getFragmentTypes();
	const fragmentMatcher = new IntrospectionFragmentMatcher({
		introspectionQueryResultData
	});
	const client = new ApolloClient({
		link: new SchemaLink({ schema: schema }),
		cache: new InMemoryCache({fragmentMatcher}),
		connectToDevTools: true
	});
	client.initQueryManager();
	window['fortune'] = genie.getDataResolver();
	window['store'] = window['fortune'].getStore();
	window['schema'] = schema;
	window['client'] = client;
	window['graphql'] = graphql;
	window['subscribe'] = subscribe;

	const rawData = await genie.getRawData();
	console.log(rawData);
	rawData.forEach(element => {
		if (element.name && element.name !== 'test') {
			element.name = 'Update5';
		} else if (element.text) {
			element.text = 'update5';
		}
	});
	console.log(rawData);
	await genie.importRawData(rawData, true);
	console.log('imported');
	console.log(await genie.getRawData());
	// await genie.importRawData([{
	// 	'id': '2d',
	// 	'name': 'test2',
	// 	'address': {
	// 		'id': 'bGExb1dGdlBKc1FZa1RBOkFkZHJlc3M='
	// 	},
	// 	'submissions': [
	// 		{
	// 			'id': 'ZEpQa1dRTlNxN0xyVG4yOkNvbW1lbnQ='
	// 		}
	// 	]
	// }], true, 'User');
	// console.log('imported');
	// console.log(await genie.getRawData());


	// await client.mutate({
	// 	mutation: gql`mutation {
	// 		createUser (input: {
	// 			data: {
	// 				liked: {
	// 					comments: {
	// 						create: {
	// 							text: "bam"
	// 						}
	// 					}
	// 				}
	// 			}
	// 		}) {
	// 			data {
	// 				id
	// 				liked {
	// 					edges {
	// 						node {
	// 							text
	// 						}
	// 					}
	// 				}
	// 			}
	// 		}
	// 	}
	// 	`
	// });
};

buildClient(genie);
