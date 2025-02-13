def test_engine_configuration():
    """Test database engine configuration."""
    engine = create_async_engine(
        settings.database_url,
        echo=settings.debug,
        future=True,
        poolclass=NullPool,
    )
    assert engine.dialect.name == "postgresql"
    assert engine.echo == settings.debug
    assert engine.future


def test_session_factory_configuration():
    """Test session factory configuration."""
    engine = create_async_engine(
        settings.database_url,
        echo=settings.debug,
        future=True,
        poolclass=NullPool,
    )
    session_factory = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    session = session_factory()
    assert isinstance(session, AsyncSession)
    assert session.bind.dialect.name == "postgresql" 