const { Category } = require('../../../models');
const NotFound = require('../../errors/NotFoundError');

class CategoryService {
    async getAll() {
        const categories = await Category.findAll(); 
        if (categories.length === 0) throw new NotFound('Kategori data belum terisi!');
        return categories;
    }

    async getById(id) {
        const category = await Category.findByPk(id);
        if (!category) throw new NotFound('Kategori tidak ditemukan!');
        return category;
    }

    async create(data) {
        return await Category.create(data);
    }
    async update(id, data) {
        const category = await Category.findByPk(id);
        if (!category) throw new NotFound('Kategori tidak ditemukan!');
        await category.update(data);
        return category;
    }
    async delete(id) {
        const category = await Category.findByPk(id);
        if (!category) throw new NotFound('Kategori tidak ditemukan!');
        await category.destroy();
        return true;
    }
}

module.exports = new CategoryService();