import  GraphQLGenie  from './GraphQLGenie';
import { ApolloClient } from 'apollo-client';
import { InMemoryCache, IntrospectionFragmentMatcher, IntrospectionResultData } from 'apollo-cache-inmemory';
import { SchemaLink } from 'apollo-link-schema';
import gql from 'graphql-tag';

const typeDefs = `

interface Submission {
	id: ID! @isUnique
	title: String!
	text: String
}

type Post implements Submission @model {
  id: ID! @isUnique
	title: String!
	text: String
  author: User @relation(name: "WrittenSubmissions")
	likedBy: [User!]! @relation(name: "LikedPosts")
	comments: [Comment] @relation(name: "CommentsOnPost")
}

type Comment implements Submission @model {
  id: ID! @isUnique
	title: String!
	text: String
  author: User @relation(name: "WrittenSubmissions")
	post: Post @relation(name: "CommentsOnPost")
	approved: Boolean @default(value: "true")
}

type User @model {
  id: ID! @isUnique
  name : String!
  address: Address @relation(name: "UserAddress")
  writtenSubmissions: [Submission!]! @relation(name: "WrittenSubmissions")
  likedPosts: [Post!]! @relation(name: "LikedPosts")
}

type Address @model {
  id: ID! @isUnique
  city: String!
  user: User @relation(name: "UserAddress")
}
`;

const fortuneOptions = { settings: { enforceLinks: true } };
const start = Date.now();
console.log('GraphQL Genie Started');
const genie = new GraphQLGenie({ typeDefs, fortuneOptions});
const buildClient = async (genie: GraphQLGenie) => {
	const schema = await genie.getSchema();
	console.log('GraphQL Genie Completed', Date.now() - start);
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

let createPost = gql`
	mutation createPost($title: String!) {
		createPost(title: $title) {
			id
		}
	}
`;

const createUser = gql`
mutation createUser($name: String!) {
	createUser(name: $name) {
		id
	}
}
`;

const createAddress = gql`
mutation createAddress($city: String!) {
	createAddress(city: $city) {
		id
	}
}
`;
	const post = await client.mutate({
		mutation: createPost,
		variables: { title: 'bam post' }
	});
	const user = await client.mutate({
		mutation: createUser,
		variables: { name: 'Corey' }
	});
	const address = await client.mutate({
		mutation: createAddress,
		variables: { city: 'Eau Claire' }
	});
	const testData = {users: [user.data.createUser],
		posts: [post.data.createPost],
		addresses: [address.data.createAddress],
	comments: []};
	console.log('post', testData.posts[0].id,
	'user', user.data.createUser.id,
	'address', address.data.createAddress.id);
	const user2 = await client.mutate({
		mutation: createUser,
		variables: { name: 'Corey2' }
	});
	testData.users.push(user2.data.createUser);

	const setUserAddress = gql`
	mutation setUserAddress($addressAddressId: ID!, $userUserId: ID!) {
		setUserAddress(addressAddressId: $addressAddressId, userUserId: $userUserId	) {
			addressAddress {
				id
				city
				user {
					name
				}
			}
			userUser {
				id
				name
				address {
					city
				}
			}
		}
	}
	`;
	let result = await client.mutate({
		mutation: setUserAddress,
		variables: { userUserId: testData.users[0].id, addressAddressId: testData.addresses[0].id}
	});
	console.log(result);


	const title = 'Genie is great';
	createPost = gql`
		mutation createPost($title: String!, $authorId: ID) {
			createPost(title: $title, authorId: $authorId) {
				id
				title
				author {
					id
					name
				}
			}
		}
		`;
	result = await client.mutate({
		mutation: createPost,
		variables: { title: title, authorId: testData.users[0].id}
	});
	testData.posts.push(result.data.createPost);


	const createComment = gql`
		mutation createComment($title: String!, $postId: ID!, $authorId: ID!) {
			createComment(title: $title, postId: $postId, authorId: $authorId) {
				id
				title
				author {
					id
					name
				}
			}
		}
		`;
	result = await client.mutate({
		mutation: createComment,
		variables: { title: title, postId: testData.posts[1].id, authorId: testData.users[1].id}
	});
	testData.comments.push(result.data.createPost);

	const fragment = gql`fragment user on User{
		name
		writtenSubmissions {
			id
			title
		}
	}`;
	const userWithFragment = gql`
		query User($id: ID!) {
			User(id: $id) {
				id
				address {
					id
					city
					user {
						...user
					}
				}
			}
		}
		${fragment}
		`;
	result = await client.query({
		query: userWithFragment,
		variables: { id: testData.users[0].id}
	});
	console.log(result.data);


// 	const unsetUserAddress = gql`
// 	mutation unsetUserAddress($addressAddressId: ID!, $userUserId: ID!) {
// 		unsetUserAddress(addressAddressId: $addressAddressId, userUserId: $userUserId	) {
// 			addressAddress {
// 				id
// 				city
// 				user {
// 					name
// 				}
// 			}
// 			userUser {
// 				id
// 				name
// 				address {
// 					city
// 				}
// 			}
// 		}
// 	}
// 	`;
// result = await client.mutate({
// 	mutation: unsetUserAddress,
// 	variables: { userUserId: testData.users[0].id, addressAddressId: testData.addresses[0].id}
// });
// console.log(result);

};

buildClient(genie);


