module.exports = (sequelize, DataTypes) => {
    const MonthlySummary = sequelize.define('MonthlySummary',{
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        month: {
            type: Sequelize.STRING(25),
            allowNull: false,
        },
        year: {
          type: Sequelize.STRING(4),
          allowNull: false,
        },
        total_income: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        total_expense: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        balance: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        ai_summary: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        ai_recomendation: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        created_at: {
            allowNull: false,
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            allowNull: false,
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
     }, {
        sequelize,
        modelName: 'MonthlySummary',
        tableName: 'monthly_summaries',
        timestamp: false,
        underscored: true
     });

     MonthlySummary.associate = (models) => {
        MonthlySummary.belongsTo(models.User, {
            foreigenKey: 'user_id', 
            as: 'summary_user'
        })
     }

     return MonthlySummary;
}