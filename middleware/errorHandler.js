export const errorHandler = (err, req, res, next) => {
  console.error('Hata:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Doğrulama hatası',
      details: Object.values(err.errors).map(e => e.message)
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      error: 'Bu email zaten kayıtlıdır'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Geçersiz token'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Sunucu hatası oluştu'
  });
};
