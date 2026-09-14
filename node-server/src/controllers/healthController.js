/**
 * Health Controller for node-server
 */
export const getHealth = (req, res) => {
  return res.status(200).json({
    success: true,
    service: 'node-server'
  });
};
