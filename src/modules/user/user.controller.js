const NotFound = require('../../errors/NotFoundError');
const UserService = require('./user.service');

class UserController {
    async getAll(req, res, next){
        try {
            const users = await UserService.getAll();
            if (users.length === 0) throw new NotFound("Data Users Belum Ada!");
            res.json({
                success: true, 
                message: "User Berhasil Di dapat!", 
                data: users 
            })
        }catch(err) {
            next(err)
        }
    }

    async getById(req, res, next) {
        try {
            const user = await UserService.getById();
            if (!user) throw new NotFound("Data User Belum Ada!");
            res.json({
                success: true, 
                message: "User Berhasil Di dapat!", 
                data: users 
            })
        } catch (err) {
            next(err)
        }
    }

    async ceate(req, res, next) {
        try {
            const user = await UserService.create(req.body);
            res.status(201).json({success: true, message: "User Berhasil Dibuat", data: user})
        } catch (err) {
            next(err)
        }
    }

    async update(req, res, next) {
        try {
            const user = await UserService.update(req.params.id, req.body);
            if (!user) throw new NotFound("Data User Tidak Ditemukan")
            res.status(200).json({success: true, message: "User Berhasil Diupdate", data: user})
        } catch (err) {
            next(err)
        }
    }

    async delete(req, res, next) {
        try {
            const user = await UserService.delete(req.params.id);
            if (!user) throw new NotFound("Data User Tidak Ditemukan")
            res.status(200).json({success: true, message: "User Berhasil Dihapus", data: user})
        } catch (err) {
            next(err)
        }
    }
}

module.exports = new UserController();