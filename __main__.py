import os
from flask import Flask
from flask_restful import Api
from werkzeug.security import generate_password_hash, check_password_hash
from models import Roles, db, authorize, login_manager
from routes import (Auth, 
                    AuthProfile, 
                    AuthProfileCat, 
                    AuthProfileDel, 
                    AuthWildLife, 
                    AuthReport,
                    GuestWildLifeMany, 
                    GuestWildLifeOne,
                    GuestReport)


if __name__ == '__main__':
    app = Flask('WildWatch')
    app.config['SECRET_KEY']                     = str(os.urandom(24).hex())
    app.config['SQLALCHEMY_DATABASE_URI']        = 'sqlite:///db.sqlite'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['FLASK_DEBUG']                    = True
    authorize.init_app(app)
    db.init_app(app)
    login_manager.init_app(app)
    api = Api(app)
    api.add_resource(Auth,              '/auth')
    api.add_resource(AuthProfile,       '/auth/profile')
    api.add_resource(AuthProfileCat,    '/auth/profile/<string:category>')
    api.add_resource(AuthProfileDel,    '/auth/profile/<int:userid>')
    api.add_resource(AuthWildLife,      '/auth/wildlife')
    api.add_resource(AuthReport,        '/auth/report/<int:reportid>')
    api.add_resource(GuestWildLifeMany, '/guest/wildlife')
    api.add_resource(GuestWildLifeOne,  '/guest/wildlife/<int:wildlifeid>')
    api.add_resource(GuestReport,       '/guest/report')

    
    if not os.path.exists('db.sqlite'):
        with app.app_context():
            db.create_all()
            new_role = Roles(id=1, 
                             name='curator')
            db.session.add(new_role)
            db.session.commit()
            new_role = Roles(id=2, 
                             name='user')
            db.session.add(new_role)
            db.session.commit()
    app.run(debug=True)
