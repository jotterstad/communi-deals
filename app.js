
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , create = require('./routes/create')
  , success = require('./routes/success')
  , http = require('http')
  , path = require('path')
  , md5 = require('MD5')
  , passport = require('passport')
  , ObjectID = require('mongodb').ObjectID
  , LocalStrategy = require('passport-local').Strategy;


passport.serializeUser(function(user, done) {
  //console.log(user.email);
  done(null, user);
}); 

passport.deserializeUser(function(user, done) {
    //console.log(user);
    done(null, user);
});

  passport.use(new LocalStrategy(
  function(username, password, done) {
	require('mongodb').connect(mongourl, function(err, conn){		      
		conn.collection('users', function(err, coll){
			password = md5(password).toString();	      
    		coll.findOne({ username: username},function (err, user) {
	
			
					      if (err) { return done(err); }
					      if (!user) {
					        return done(null, false, { message: 'Incorrect username.' });
					      }
					      if (user.password != password) {
					        return done(null, false, { message: 'Incorrect password.' });
					      }
					      //console.log(user);
					      return done(null, user);
					     
				});
			});
    });
  }
));


var app = express();

app.configure(function(){
  app.set('port', process.env.VCAP_APP_PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('drumkit'));
  app.use(express.session());
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});


//mongoDB
if(process.env.VCAP_SERVICES){
    var env = JSON.parse(process.env.VCAP_SERVICES);
    var mongo = env['mongodb-1.8'][0]['credentials'];
}
else{
    var mongo = {
    "hostname":"localhost",
    "port":27017,
    "username":"",
    "password":"",
    "name":"",
    "db":"dealsapp01"
    }
}
var generate_mongo_url = function(obj){
    obj.hostname = (obj.hostname || 'localhost');
    obj.port = (obj.port || 27017);
    obj.db = (obj.db || 'deals');
    if(obj.username && obj.password){
        return "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port + "/" + obj.db;
    }
    else{
        return "mongodb://" + obj.hostname + ":" + obj.port + "/" + obj.db;
    }
}
var mongourl = generate_mongo_url(mongo);


//Control Routes

app.get('/', ensureAuthenticated, function(req, res){
	require('mongodb').connect(mongourl, function(err, conn){
		conn.collection('deals', function(err, coll){
			coll.find().sort({ _id: -1}).toArray(function(err, data){
				
				delete req.user.password;
				
				var email = req.user.email;
				var avatar = email.toLowerCase();
				//console.log(req.user);
				
				res.render('index.ejs', {
					 deals: JSON.stringify(data),
					 title: "Hello",
					 user:  JSON.stringify(req.user),
					 avatar: md5(avatar)
					});
				//res.redirect(routes.index);
			});
		});
	});
		
});

app.get('/details/:id',ensureAuthenticated, function(req, res){
    var id = new ObjectID(req.params.id);
    //TO DO - ObjectID warns the console that it want a 12 byte or 24hex string.
	require('mongodb').connect(mongourl, function(err, conn){
		conn.collection('deals', function(err, coll){
			coll.find({ _id: id }).toArray(function(err, data){
				//console.log(data);
				var email = req.user.email;
				var avatar = email.toLowerCase();
				
				res.render('details.ejs', {
					 deals: JSON.stringify(data),
					 title: "Hello",
					 user:  JSON.stringify(req.user),
					 avatar: md5(avatar)
					});
				//res.redirect(routes.index);*/
			});
		});
	});
})

app.get('/success', success.success);
app.get('/create', create.create);
app.post('/create', function(req, res){
	
	require('mongodb').connect(mongourl, function(err, conn){
        conn.collection('deals', function(err, coll){
            /*POST vars from form*/
            var deal_title = req.param("deal_title");
            var deal_detail = req.param("deal_detail");
            var deal_bname = req.param("deal_bname");
            var deal_blogo = req.param("deal_blogo");
            
            /* Simple object to insert  */
            object_to_insert = { 'deal_name': deal_title, 'deal_bname': deal_bname, 'deal_blogo' : deal_blogo, 'deal_detail': deal_detail, 'deal_created_on': new Date() };
            /* Insert the object then print in response */
            /* Note the _id has been created */
            coll.insert( object_to_insert, {safe:true}, function(err){
            
            //res.writeHead(200, {'Content-Type': 'text/plain'});
            //res.write(JSON.stringify(object_to_insert));
            res.redirect('/');
            //res.end('\n');
            });
        });
    });
});

app.get('/user/new', function(req, res){
	res.render('usernew.ejs');
});

app.post('/user/new', function(req, res){
	
	require('mongodb').connect(mongourl, function(err, conn){
        conn.collection('users', function(err, coll){
            /*POST vars from form*/
            var username = req.param("username");
            var firstname = req.param("firstname");
            var lastname = req.param("lastname");
            var password = md5(req.param("password"));
            var email = req.param("email");
            
            /* Simple object to insert  */
            object_to_insert = { 'username' : username, 'firstname' : firstname, 'lastname' : lastname, 'password' : password, 'email' : email, 'created_on': new Date() };
            /* Insert the object then print in response */
            /* Note the _id has been created */
            coll.insert( object_to_insert, {safe:true}, function(err){
            
            //res.writeHead(200, {'Content-Type': 'text/plain'});
            //res.write(JSON.stringify(object_to_insert));
            res.redirect('/success');
            //res.end('\n');
            });
        });
    });
});

app.get('/profile', ensureAuthenticated, function(req, res){

	var id = new ObjectID(req.user._id);
	//console.log(id);

	require('mongodb').connect(mongourl, function(err, conn){
		conn.collection('users', function(err, coll){
			//Result Projection excludes pass hash from being displayed.
			coll.find({ _id: id }, {password: 0}).toArray(function(err, data){
				//console.log(data);
				var email = data[0].email;
				var avatar = email.toLowerCase();
				
				res.render('profile.ejs', {
					 title: "Hello",
					 user:  JSON.stringify(req.user),
					 avatar: md5(avatar),
					 deals: JSON.stringify({"none":"none"})
					});
				//res.redirect(routes.index);
			});
		});
	});
});

app.post('/profile',ensureAuthenticated, function(req, res){
	require('mongodb').connect(mongourl, function(err, conn){
        conn.collection('users', function(err, coll){
            /*POST vars from form*/
            var id = new ObjectID(req.user._id);
            var firstname = req.param("firstname"); 
            var lastname = req.param("lastname"); 
            var email = req.param("email");
            
            /* Simple object to insert  */
            
            /* Insert the object then print in response */
            /* Note the _id has been created */
            coll.update(
            	{ _id: id },
            	{$set: { 'firstname' : firstname, 'lastname' : lastname, 'email' : email }}, 
            	{safe:true}, function(err){
	            //res.writeHead(200, {'Content-Type': 'text/plain'});
	            //res.write(JSON.stringify(object_to_insert));
	            res.redirect('/profile');
	            //res.end('\n');
            });
        });
    });
});

app.get('/login', function(req, res){
	res.render('login.ejs');
});

app.post('/login', 
  passport.authenticate('local', { failureRedirect: '/login?err' }),function(req, res) {
    // Authentication successful. Redirect home.
    //console.log("Found");
    res.redirect('/');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});


http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}