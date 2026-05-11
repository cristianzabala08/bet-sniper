import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { LogoComponent } from 'src/app/shared/components/logo/logo.component';
import { TokenService } from 'src/app/shared/services/jwt-token.service';
import { UserService } from 'src/app/core/services/user.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { RouterModule } from '@angular/router';

export interface ReferralNode {
  username: string;
  fullname?: string;
  avatar?: string;
  level: number;
  children?: ReferralNode[];
  expanded?: boolean;
  isActive?: boolean;
  referralsCount?: number;
  // added to support buildTree logic
  referredBy?: string;
}

@Component({
  standalone: true,
  selector: 'app-my-network',
  templateUrl: './my-network.component.html',
  styleUrls: ['./my-network.component.scss'],
  imports: [LogoComponent, TranslateModule, CommonModule, RouterModule],
})
export class MyNetworkComponent implements OnInit {
  fullName: string = '';
  username: string = '';
  pointsBalance: number = 0;
  isRootExpanded: boolean = true;
  referrals: ReferralNode[] = [];

  // Stats
  referralsCount: number = 0;
  referralsNetwork: number = 0;
  referralsNetworkActive: number = 0;
  monthlyReferralsCount: number = 0;

  constructor(
    private tokenService: TokenService,
    private userService: UserService,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    const userData = this.tokenService.getPayload();
    const username = (userData as any)?.username;
    if (username) {
      this.username = username;
      this.loadUserData(username);
      this.loadReferralsTree(username);
    }
  }

  loadUserData(username: string) {
    this.userService.getUser(username).subscribe({
      next: (user) => {
        if (user.fullname) this.fullName = user.fullname;
        this.pointsBalance = user.points || 0;
      },
      error: (err) => console.error('Error fetching user:', err),
    });
    // Fetch stats
    this.userService.getReferrals(username).subscribe({
      next: (res) => {
        this.referralsCount = res.referralsCount || 0;
        this.referralsNetwork = res.referralsNetwork || 0;
        this.referralsNetworkActive = res.referralsNetworkActive || 0;
        this.monthlyReferralsCount = res.referralsMonth || 0;
      },
      error: (err) => console.error('Error fetching stats:', err),
    });
  }

  loadReferralsTree(username: string) {
    this.userService.getReferralTree(username).subscribe({
      next: (flatList: any[]) => {
        this.referrals = this.buildTree(flatList, username);

        // Default collapsed to show only Level 1 (purple)
        this.referrals.forEach((node) => (node.expanded = false));
      },
      error: (err) => console.error('Error fetching referral tree:', err),
    });
  }

  // Convert flat list from backend to tree structure
  buildTree(flatList: any[], rootUsername: string): ReferralNode[] {
    const nodesMap = new Map<string, ReferralNode>();
    const rootNodes: ReferralNode[] = [];

    // 1. Create all nodes
    flatList.forEach((item) => {
      nodesMap.set(item.username, {
        username: item.username,
        fullname: item.fullname,
        level: item.level,
        isActive: item.isActive,
        children: [],
        expanded: false,
        referredBy: item.referredBy,
      });
    });

    // 2. Build relationships
    flatList.forEach((item) => {
      const node = nodesMap.get(item.username);
      if (node) {
        if (item.referredBy === rootUsername) {
          // Direct child of the current user
          rootNodes.push(node);
        } else {
          // Child of someone else in the tree
          const parent = nodesMap.get(item.referredBy);
          if (parent) {
            parent.children?.push(node);
          }
        }
      }
    });

    return rootNodes;
  }

  toggleNode(node: ReferralNode) {
    node.expanded = !node.expanded;
  }

  toggleRoot() {
    this.isRootExpanded = !this.isRootExpanded;
  }

  copyReferralLink() {
    if (!this.username) return;
    const referralLink = `${window.location.origin}/auth/register?ref=${this.username}`;
    navigator.clipboard.writeText(referralLink).then(
      () =>
        this.toast.success(
          'Link de referido copiado al portapapeles / Referral link copied to clipboard',
        ),
      () => this.toast.error('Error al copiar el link / Error copying link'),
    );
  }
}
