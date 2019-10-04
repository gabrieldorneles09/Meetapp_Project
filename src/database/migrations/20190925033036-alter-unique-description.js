module.exports = {
  up: queryInterface => {
    return queryInterface.removeConstraint('meetups', 'meetups_descricao_key');
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('meetups', 'descricao', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    });
  },
};
