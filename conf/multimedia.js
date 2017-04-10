module.exports = {
  instanceId:'sys-pkg',
  instanceName:'sys-pkg',

  serverListen: {
    port: 9001,
    host: '127.0.0.1'
  },

  mongo: {
    uri: 'mongodb://localhost/noonian-multimedia'
  },

  enablePackaging:true,
  enableHistory:false, //awaiting fix to system to enable this
  
  packageFsConfig:{
    'sys.multimedia':'../noonian-multimedia/noonian_pkg'
  },
  
  // Secret for session, TODO configure to use PKI
  secrets: {
    session: 'change me'
  },
  
  urlBase:'multimedia',
  
  dev:true

};
