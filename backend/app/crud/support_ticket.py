"""CRUD for SupportTicket."""
from app.crud.base import CRUDBase
from app.models.support_ticket import SupportTicket
from app.schemas.support_ticket import SupportTicketCreate, SupportTicketUpdate


class CRUDSupportTicket(
    CRUDBase[SupportTicket, SupportTicketCreate, SupportTicketUpdate]
):
    pass


support_ticket = CRUDSupportTicket(SupportTicket)
