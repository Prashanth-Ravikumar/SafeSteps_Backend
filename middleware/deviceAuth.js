export const deviceAuth = (req, res, next) => {
  try {
    const { deviceSecret } = req.body;
    const commonDeviceSecret = "jjskcineoneohsonoai27384991748482199";

    if (deviceSecret !== commonDeviceSecret) {
      return res.status(401).json({
        success: false,
        message: "Invalid device secret",
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Device authentication error",
    });
  }
};
