const Crud=require('./crudController'); const CrudService=require('../services/crudService'); const BaseRepository=require('../repositories/baseRepository');
module.exports=(Model,populate='')=>Crud(new CrudService(new BaseRepository(Model)),populate);
