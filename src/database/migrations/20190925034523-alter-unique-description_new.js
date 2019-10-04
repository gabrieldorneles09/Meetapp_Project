module.exports = {
  up: queryInterface => {
    return queryInterface.removeConstraint('meetups', 'meetups_descricao_key1');
  },
};
