const { ApolloServer } = require('apollo-server')
const typeDefs = require('./schema');
const { createStore } = require('./utils');
const resolvers = require('./resolvers');
const isEmail = require('isemail');
const LaunchAPI = require('./datasources/launch');
const UserAPI = require('./datasources/user');

const store = createStore();

const server = new ApolloServer({ 
    typeDefs,
    resolvers,
    engine: {
        reportSchema: true
    },
    dataSources: () => ({
        launchAPI: new LaunchAPI(),
        userAPI: new UserAPI({ store })
    }),
    context: async ({ req }) => {
        console.log(`req.headers: ${JSON.stringify(req.headers)}\n
        req.headers.authorization: ${req.headers.authorization}`);
        // simple auth check on every request
        const auth = req.headers && req.headers.authorization || '';
        const email = Buffer.from(auth, 'base64').toString('ascii');
        if (!isEmail.validate(email)) return { user: null };
        // find a user by their email
        const users = await store.users.findOrCreate({ where: { email } });
        const user = users && users[0] || null;
        return { user: { ...user.dataValues } };
    }
});

server.listen().then(({url}) => {
    console.log(`Server ready at ${url}`);
})