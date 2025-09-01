"""Simple test file that doesn't depend on any fixtures."""


def test_simple():
    """Simple test that always passes."""
    assert True


def test_math():
    """Test basic math operations."""
    assert 1 + 1 == 2
    assert 2 * 3 == 6
    assert 10 / 2 == 5
    assert 10 % 3 == 1
